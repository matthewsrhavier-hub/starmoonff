'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Camera,
  ArrowLeft,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LogoLink } from '@/components/layout/Logo';
import { ProfileHeader } from '@/components/layout/ProfileHeader';
import { getSelectedProfile } from '@/lib/selectedProfile';

const AVATAR_CATEGORIES = [
  {
    id: 'classics',
    name: 'Os Clássicos',
    avatars: [
      { name: 'Scarlet Chilleez', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABYSw2XUJOe-RXGqlMhzAK2kb3m8jiiuICaICOYRemQXvfBcEmoaG0XMebWDsKrQ4fhsAYwzopxK6Cm5l5w2F9iMzCVqZuapW7A.png?r=201' },
      { name: 'Sunny Chilleez', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABVAOVZB6hbXn66eL28YYwIrZ3y7G9clKxQtWp-2Dc1_uq2MuLsPa_mD3N1jJlpMc_61au7gZ69iuTZmeg_YjE-5YKAGbR8JFKg.png?r=7c7' },
      { name: 'Robin Chilleez', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABcD0ZrsIMMPdVENlhcMLhAEQsGSplhivXwxPolt5h1wP1bquIL83x4fkrS6we4cwNWTe1nn7exw7GDMLe-72PiRcoMIBjdjmmA.png?r=b39' },
      { name: 'Dusty Chilleez', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABQF7SR467QFM7baRi8ZVxwtPaStoMd9-KZ8qZqba8Tuu8x9OWqkYvzubJwrfBQmJp0spenD2JvuyNz7H1OuY3zhTr6_hZokHwQ.png?r=6a6' },
      { name: 'Purple Superhero', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABWP7dngMuFj6d4Hr3kCkJAijucivMNIbY6ak4NJtbCgEWKSEqE_31Kp6kTIip3kS0JUhEnA78GnsLSq0M829d2jpc4aqffP5ng.png?r=558' },
      { name: 'Moustache', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABeKAhhelX-wz_RiGf_mTrXQgLH9heqmzLj3VTGX3aATuJpHuRGWC_BHqa2yc7HXPSgQ9bfDKD5aXWG7yPRSIYNRVj1CSfDpqNw.png?r=cad' },
      { name: 'Dog', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABRNxh2T8XhS7jBOLKwI1j-R0CJFhtTa-nxz5EhkX0EL4ue-amefp4mC1fsf0-rd8vynj9TXF2unD7iD4vFlh5kp5XCMtfUa4NA.png?r=a16' },
      { name: 'Red Superhero', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABQbPHLHMADSYHIjUxUrTHwEeJXOX-rF9NpbKyfLmXJnukropAUAR-faZGpu9eIgjUKX5udaZMo6Wze-ifSqCOKW7CfizWSlYJg.png?r=eea' },
      { name: 'Purple Penguin', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABSQGQWkzf71tVsbzO1dU6kvtezyXhoWTkUzebNS_MSeRVGdckDNMVs1q7DIks1J_qGDNfrVjr2OEZvTPsNq9zBLKCbgRvCj-RA.png?r=d47' },
      { name: 'Pink Giggle', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABafGsF7RLiQlTUx1eVpITxBZ5Me8s0M3fvgIbDNpwk1-2dnsNGRdzVOyajfwonpnfF3MKRdPt2l5GejDXr3cbGE8fVV1YWdHhw.png?r=ce4' },
      { name: 'Chicken', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABd148B0ZT3d_N6KcgB2_xM2k57VsubEa0FQBp3lj_WPe1m9Zzbgq_KkVdLNfvUmTN5hm7kvTTd0JF9QMxEjW_-TaX5u9vo2QBg.png?r=181' },
      { name: 'Eye Patch', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdxbwI5TRu89nI_cd6jTv-IflvV5Zk6Cs4_ZbL9TqcYqro8KZ6RonjEQZn0ZSkwYJ50xjR6_nbqnnvwVYYCaTagdYdV3aQrkqA.png?r=ae9' },
      { name: 'Alien', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABWkqCkPdPuyQh9kOjmHPTUZfwG-R8QZbs-drqkZh8qzWeyICABKFknYDnpl_2Nj4pYCA3UxVu3IjuFjW_B_3D5_5I9R4ynhH1g.png?r=ab6' },
      { name: 'Robot', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABXwk27Bpx7x-kivs1O83w6DTP0-5K9aJskVTGucM5M61FxBrnaQitmkf2uIii7wv6Zcvic2v1Q-rmaEB9qkES8OQ4tPrsHhXwQ.png?r=bb0' },
      { name: 'Mummy', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABRaGfMeG37Ayx3OwvsEqeTlSVvQWzVOiEfYQ8GRHx3zhx81IZy88ZnGN-cU7XLgoc-fIvFfp1ue_Pl-Vqw2cL7KiX5BRdj7z1g.png?r=59d' },
      { name: 'Helmet', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABcVQpnZKvDFkrGbvZ1Z5QXziVqAK3aaBrGCqsgltpUilQBRAFFYvmyqlRlZF3WubCdfFfzDnVyeNa3kFjxLgif-qYdfJbpj8VQ.png?r=15e' },
      { name: 'Red Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABfMnIhIdkM8LdU5BZaYVaxoVTrMGzIjafPBzCQUwebzxeK7JKvcI7-Jm-5AituzcdJYIT_45NSkbbTwfVva-E01G9J1YVVBveA.png?r=e6e' },
      { name: 'Dark Grey Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABWdAPWT0Vb3Eth37phC9Wplk4PJYY04xKlrvLf6eD_pjXTNUMjeq7Q8DgqgYbj8qbJr-766Vmg-Z3YSsEOxObXKphMTFZd-A8g.png?r=bd7' },
      { name: 'Yellow Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABZf5kiIAuiZG_DvLse1xSkgukFUqHQQR5d6qSDQBlw720nd7cYHcXavvtFNfg5814g1njOdPHGbrKYs9KdWq9hnEqL2-xxh5MA.png?r=1d4' },
      { name: 'Green Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABV0j-bGEVAaWomcgXqIMEfw-h-in8B5DB_edifknx-3aNWWIQKU1KMFN9OZtzQMTCYp2ovDEaPHJlCkDBmdtDUTJwUb0-c_BBg.png?r=a4b' },
      { name: 'Blue Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABUoj4FT-0Rr558WbETiintMnmH2JKw4l_p4MdMoxqVx7YXwsvLvvnGUtx3HKZN_BJFH4EHpXn5KqSCBVxLrRz0n4gk64yyeAFw.png?r=229' },
      { name: 'Purple Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABSVY0nClWjEeYZcqCRHYlGkM3xLJGCigAOsoESa7WaW8hH_99_LBnn4U8OrZJp78wh2FvQH3YGDKCmnKx0L_iT5bc8tc2A8AYQ.png?r=98e' },
      { name: 'Pink Smile', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABRALaKaonY6GfYhbjPRi6y9-yRNzLhI4bjZmc95qXOZODKsLQm6mxPAoEPA9ukfvHSo_OYWkmO1akAmMPTKzig9XzSYimmYUUA.png?r=54c' },
      { name: 'Loading Icon', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABaOUM79jMcgAlMo2ew01lkY2HzpiaJMoRZP1fRkjgxX_b06h7opq67-JgtaI9oAP48rlNMt1fzgKrcps2L_VfJ83JkX5WdJRdg.png?r=937' },
      { name: 'Bandersnatch', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABQLGmFynSN-44kcdclbjgaSIgThBZ9NqR31wLt0s4wvec8XoDyc6eNvapsKe-xy6CJEbWVpshUoyer1WwfMKLy0AplsmtNhATg.png?r=2e5' },
      { name: 'Broken Smiley Face', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABUZFF0kWBRJVZNgKrAe3D4RP7hVcDwYVaJd4ROmE9oDJzuuXRBlzWx7DQEbQf1uAsQ71xp0mFdT7_KxwMPGYu4BvktLMMrj2Ew.png?r=8ff' },
      { name: 'Glyph', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABf1XHT99QnZ7MmHaGNaI5sRIMR1bu68SaTpoYqT_13xpZoeQy-hm5sAtXo_cMDKJ4mokmMEk4bIGbrsCbsSNJqxpXZG8XuxTdQ.png?r=eda' },
      { name: 'Doll', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABbsINg7v_-e4oLhP4bIco6QLue0zRB25qhI8YGD60_p6ChAszw5Yn7Ip_gbcp9lInsQw4E3WzKgjmOOcQuVBSOubr90ravfdTQ.png?r=00c' },
      { name: 'Stuffed Animal Monkey', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABZ_xmd46cR7ogp3-v6igxij6YoADQGZiYG-_Blhg_2xQL0swkEzzD2IFz0B-gcsybFwBk2VBvkPke8d8YPGflZhHROyXzD7C7A.png?r=8d9' },
      { name: 'Waldo', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABYdryxLGMoUVoWhTzo5qv1LBoVATobVMkXCgmlfHJz6vSPiv34nrYAwipKRu7CS4rP89JH5FND2PT6APknPK0Hb26oexfuEEdQ.png?r=19c' },
    ]
  },
  {
    id: 'cobra-kai',
    name: 'Cobra Kai',
    avatars: [
      { name: 'Daniel', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABUuJkcqfTU_Pxqx-wPjgtktVoO6bubyXK-5hk6XNKnYQpDd9UZFp9gNZmq3aE9zmA0L148Xi0k10u8Kz-rNgxX4ZoL6CCWjCnw.png?r=a48' },
      { name: 'Johnny', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABRTzjHMLp_V4lvvJunatv6AM5p7HK8CM26ZwA8bgllwfSqoMtEr1IPKx380AJRw_6ktjhsLDzpnp2gjqAGCRtbLx439kPwXIDA.png?r=de5' },
      { name: 'Kreese', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABX1xGCcp7ypx9VMpHQwdAk9FJV8cOHRhYGMU7LvvqrqGFUZECimlrbWApoX6I_9ig2ZltmnEum28ko9eHvk0c25OgTDeRGLEJA.png?r=5f6' },
      { name: 'Miguel', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABZQECqc59lfY9RoOGu06ZKuzes0FtLIEvgN880X6VunwyMqQ_42msOXevYntV7ss1BoJYyMzZpwDYeOb-ge4zXkzXPwgS6rTzg.png?r=0fa' },
      { name: 'Robby', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdXaercQGwLXv7GZR_Co0v03hGun44YA9DmHIApyoNVLqNJpoJAA95d2WePhDZYN4t1suO1y0dTRtoYhXv5srt72E-1e43smEQ.png?r=357' },
      { name: 'Samantha', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdO5UoelnG6qm9s6XY3bjxlvNOyPDL2Np6yoh6fMfgBqEYMALwtvFOHh7eXdIfVzUy3hgWJX-pCZNAWnEd6GVB9nbfpMu26ZAQ.png?r=bdd' },
      { name: 'Tory', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABaoZ8Fcb5s5H9OcsYl_jFeF1AR5EAnEI4w1TKSW5icIbyfN17nGoOYi9gFj-MTbzHS5zviLBczSTltR46ojTVc7HzvbgBwudag.png?r=cdf' },
      { name: 'Hawk', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdYFMN28Rj8mRanOnShae_kOBiGquTivQ-4IE-ZcIAIP1mKs2F6o5RfwI2F1Hb80uDBUj4XWJCbPnn-edMyhqQ7UzQtw9TaYoA.png?r=f70' },
      { name: 'Demetri', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdq0mP1DjFG03pJxPz9iLja1UPDGRb902i4ug5AK_GQYP-tzSWwxBbtV4Fzjtuw6dfOzMc_8h8Qmah6gPrmJYAclptmm3xRkCA.png?r=9a5' },
      { name: 'Terry Silver', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABdD_6xefHK5we0anzkfxvNlCUKxp0y4RGbbiJoGovwtjAa_Zymeo1ySc1tswYxdbGei_aVHtXLFdZ4g5rdjMkbhHzDq0RxV-0w.png?r=b8d' },
      { name: 'Amanda', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABadcXkVV_gmOnEegWTqBH48OkSMKk7e2Ifz-VMSRIFy6C0DYL1-UgCtxSgLE_KjWwJR7cEEi7IhlD5Sf23v3xY1gxVGy7vEkow.png?r=b18' },
      { name: 'Carmen', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABR4hqoAa18SokAhKyW_0vAcTR1NprhH2FsZLrraWlMtdp4xYm9eaDi2n9Vzkj6taj3lEqVE4KxiEk58xkXvJIZuFQ0PHZMetpw.png?r=d4c' },
      { name: 'Mr. Miyagi', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABeX0rhaZ7ub9ksROiu3j1MhwZ8VM8CIaPy99wNW-rz2wi_z83HB7XbbhH8bmhFJhQCLhT25i1AC4KM0UAS4KuuHEt_j4shpy3A.png?r=223' },
      { name: 'Cobra Kai', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABS9ZyFQWyGvJlg1SQXwybXlutRC1AhkPuYMZLRhONS91tHXEAvU9Ty-lmiIL1FdMhTHVgIvImlD2kz6Up6uNRKkWIJabRP_xyA.png?r=814' },
      { name: 'Miyagi-Do', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABSFfIUyyFfp5BFzyRJgj9RYPrDfPxeZ9y-OXKkw2k4ktREiAnDXffUsh6Y6_Sg54CjLds_ASP3dYv4VRbXs042RyCDVIX_CGkw.png?r=1a7' },
    ]
  },
  {
    id: 'stranger-things',
    name: 'Stranger Things',
    avatars: [
      { name: 'Eleven', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABQyyBznLc9trefnRqqBbDG-afrAENJJTa4E_fAEL80CG8SH9CJruWXj_dOgzLjpfYhk3vVqoZX_sKiuVb-mve1TsxoVIwWym9g.png?r=9f9' },
      { name: 'Mike', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABW6HXqFKoVZf1bk7i1fAnuFUkFWbwtMfwlfsDg4UEu8by0x2mGows1xz3gcRmIgGIJNl3I1Nz9vdp9ysTDmnbo04oPmxL1Bh_Q.png?r=e66' },
      { name: 'Lucas', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABUB43hN66c4Lt-saxjJRq8lket2G9-WXD-Kqcl_leo0wHuxWkxkQAOVu_ZMHncH-CJ05N1SNq1_1sPJ2VsmRZnzEhglb4K1u-A.png?r=934' },
      { name: 'Will', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABflhlOuO3XwbVFvh_PxV-2P7x0KoRB1iu_2GQ7kEhrcss-mSAgrALv1UaXrYcUwDJgsePxGr7Ohav3AQRPFx4G-iyuojz0wxuA.png?r=c33' },
      { name: 'Dustin', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABRBaAcLik2wEJVkgAnuGfMzEHeTl2bRo7hDUtas_nFa_Sk5jGNvA8jWZE3nRn9qTMyh341ldGwYWZCyYxitTn3Ga2WvEvvnulw.png?r=df8' },
      { name: 'Steve', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABTnJP_JyRtosPt9CbUWNc8Wh3QiLcNlmkd1hchqBUER3iCJ28WcwGrQVwmGQaCUodxh7k5j52S1cvLfcnYsX2IIrUZiMzniOig.png?r=123' },
      { name: 'Nancy', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABatfQdl04OJSyd3aBCCJRR-ZnikPoEBgL_wC8hStvIs-BVlKOJXQ2UXeS5P7DSddaGohkYZ2sQnFFv1TKxSt9OKceuYB9H362g.png?r=2f4' },
      { name: 'Jonathan', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABd40j3GNUUbA7LCsQBphIIUsZ3SYZV047x45wzr8wFI4y_4hYTz7kqn1-xR7cAG3yEj7Q70Nqy8lZuXLWtuxVhEE5P-dcgbDiQ.png?r=613' },
      { name: 'Joyce', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABXgCiVt2QEjISSnelKrPj7zSpJ3XlDz6HjpP8GFbZSOcrBVEKqdRiHrOaYZohDT13hl6DyG5os7u3CJK9sBivU4FJkMHne3Wgw.png?r=f52' },
      { name: 'Hopper', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABWz26XLp1SeMbmnT5zNbBKn6byYE2i2xcepdKuPwtv_owGymD5lblwCd0UN4ld9f_YmuQIgsqp4BbO-2-sIyGjSxcdbDBrY6YQ.png?r=d43' },
      { name: 'Demogorgon', url: 'https://occ-0-2352-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABWWI3W8XrttCXs-Pq9j8sgOuRWRvmRAF5CepVYdMYM-xFDK_cQ9V0wM6W22lmHuOUyel_WTZitjX9GFxAFAOVeX24V-ANkH8Ww.png?r=d32' },
      { name: 'Dustin with Hat', url: 'https://occ-0-8628-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABbPhR70L2CB488dNbkmwYJkaDZUVcBXFNqMiy8K-PVwrG_Q_hyMCH2-_hlcvnL8IKo9XY7j4YhnVYWstnEPSuV8EuzJizXaofA.png?r=47a' },
      { name: 'Erica', url: 'https://occ-0-8628-1740.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABWyf0sWXyGHNokoqngB0gUbaYYyeSoSuaJ325euihzRsET1gwhP_9QiaG1OOodrON-ludQiRe2VKA4CvITWMEWPqu5VBW0912Q.png?r=8f7' },
      { name: 'Max', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABWHo-caRQ4TY8mdpLq6_ZIcSQv1AIR1PbVAranrUCaO6NsDgm1sADOc0ZI-kmsjt59GkV_j4g5GMMjtSph0yyImNAnj5NK9Q1w.png?r=f70' },
      { name: 'Eddie', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABS2nsJCYz0j_DlzlDQKgjpBbCtEeowa0nGZ3dSCSJ3Es7axJBl_REksEXNz75WjYk45HXw0BPbB5DA64S5_XinRgjyWlNTtbiA.png?r=c31' },
    ]
  },
  {
    id: 'woman-day',
    name: 'Dia da Mulher & Animais',
    avatars: [
      { name: 'Taylor Swift', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABRySnF40Ku-_mP7IdkpXdwLWNgGPKQ2F_rnxV0u0MabsyOys0GSzUisIA4H8wPR-eUSUAWiw7xdwzqhBldzY8iurDBTv6D9Irv-M.png?r=1f1' },
      { name: 'Tigre', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABTQbFxa9w8aqH8hNGnrB1RVrDXcw0Bitj5SOEppnLp16830u6slREYRvtCBUXfdZvE92maFTTic89CEVf6hFvZunZprgoJ6j-Q.png?r=0a8' },
      { name: 'Rinoceronte', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABZi_VRbSOKgsO8bju6ZpiqgJv74SBIMCfpiQEpjwrsPpzWCcB0n9zV3z-31EOOgctmhaIsV03O-h50kH3Foq8pKPbcnQk-fwQg.png?r=0d4' },
      { name: 'Sapo', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABfmnTRPNuqpIy_q8Ad4f6R9U4-5YYgIC32_phidixK7Zg0ouYjyIO15-WBlMKED9cIffMnSjmX10ibrIeOfOh8Hw8sRba6e7Ig.png?r=fae' },
      { name: 'Raposa', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABXg_S6wo_gNEXqi5T1GQ9ln0WpFyOZ-X6Lv3jN7Ebmbh48xuRwv64VL7HT_c5bqbh-g8IAzbVDbkonesQ6Sj-aKFUUhFYp6zew.png?r=c1a' },
      { name: 'Pinguim', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABQP6hh5J0NYGp6SPcYZRnQmFSsoAWtTAA2fOTTW0Qw0_vvIctIcsHJ--vyBDvb3AzZK8Zy2iZc-BrTccVe5-N5WdYU1nLLFIcg.png?r=079' },
      { name: 'Tartaruga', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABYKaSKsGZLWhBL8lBYhocSuccYGpZOwUYgshUO0uyZ0GbU1v30mOkrl4pk0YFYmxayBo-ulHOO5XnCXxJxxK8h3fsE8ZoWLCQQ.png?r=664' },
      { name: 'Macaco', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABU_mAB99YhBuRjgQnNnx3OWePgfqQfuZmtUgxFCKyVoDs3ufAkMQjTtiUd0Dsrro2rQ0rUwNv6S7KAD4hbowI3UYszZOWzUYfA.png?r=82b' },
      { name: 'Capivara', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABSJea8aPaoRAGUf3W6LPaNtPj80j07WeJM5ErpkqZehCn9CC2r8R8crNoAKg0YinjC3tik7fdQHgpAhcWK2BaYfYgpSHO_hjWw.png?r=8d8' },
      { name: 'Borboleta', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABXPRbbrpQUhlhwjTxlbEqtzm_WIRF_0IBGOhrxqES5nfnvFWR5GeLrpUUA-gCcdWdSJJlVaAp1MvWxA1T1jDhIItaE3LpCItjg.png?r=5c1' },
      { name: 'Urso Polar', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABfe9W7pZvVJKaS9e4grBC8bE8WW5m3ivZg8tpZWlYHVEoIfDN2CzAuKNfiPaL3V8heNnzwDw650AeRwkYlLQ9DUQclOHbEFJMg.png?r=fcd' },
      { name: 'Tubarão', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABUjIe4yV0dCFMoevPjk6bsIrIAy_GC49k9k6qfN47zFrSpkJ9z5pxOXpY0sd3Qcr1TADWFEwmYQPcvrVlfa64O_gVEyMtwSbiA.png?r=f6a' },
      { name: 'Orangotango', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABQRUHq857vu95XpNjytjdX5CZLN7azFWPt3R-GN1hwkRnDushRAMyLkJIhfCqQlDMK7QeUBeeIU6oAEn3KHn5ba7j70uZm9ydw.png?r=a73' },
      { name: 'Pássaro', url: 'https://occ-0-3945-2567.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABedvqbPVl3nsJcqjGG7YVKfYubVzBC2ZlNGBuF_8hqrN0grWzYx0IaGgKGMF8QoTfxIw_ajRgc0SMXdbY4eyMFPcSNmO8IPChw.png?r=a83' },
    ]
  }
];

export default function WhosWatchingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CATEGORIES[0].avatars[0].url);
  const [isKids, setIsKids] = useState(false);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChoosingAvatar, setIsChoosingAvatar] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const canContinue = newProfileName.trim().length > 0 && !isSaving;

  const normalizeBirth = () => {
    const month = birthMonth.padStart(2, '0');
    const year = birthYear.trim();
    const m = Number(month);
    const y = Number(year);
    const currentYear = new Date().getFullYear();
    const ok =
      birthMonth.length > 0 &&
      year.length === 4 &&
      m >= 1 &&
      m <= 12 &&
      y >= 1900 &&
      y <= currentYear;
    return { ok, month, year, m, y };
  };

  const computeIsKids = (month: string, year: string) => {
    const m = Number(month);
    const y = Number(year);
    if (!m || !y || m < 1 || m > 12 || y < 1900) return false;
    const now = new Date();
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < m) age -= 1;
    return age < 14;
  };

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Carregar Perfis
  const loadProfiles = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Erro ao carregar perfis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadProfiles();
    }
  }, [isAuthenticated, token]);

  const selectProfile = async (profile: any) => {
    if (isEditing) return;

    const { setSelectedProfile } = await import('@/lib/selectedProfile');
    const { switchProfileHistory, syncToServer } = await import('@/services/watchProgress');

    void syncToServer(true);
    setSelectedProfile(profile);
    switchProfileHistory(String(profile.id));
    router.replace('/');
  };

  const startEditingProfile = (profile: any) => {
    setEditingProfileId(profile.id);
    setNewProfileName(profile.name);
    setSelectedAvatar(profile.avatar_url || AVATAR_CATEGORIES[0].avatars[0].url);
    setIsKids(!!profile.is_kids);
    setBirthMonth('');
    setBirthYear('');
    setShowAddModal(true);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canContinue) return;

    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      router.push('/login');
      return;
    }

    const birth = normalizeBirth();
    if (!editingProfileId && !birth.ok) {
      alert('Preencha o mês (01–12) e o ano (AAAA) de nascimento.');
      return;
    }

    const kids = birth.ok ? computeIsKids(birth.month, birth.year) : isKids;
    setIsKids(kids);
    setIsSaving(true);
    try {
      const method = editingProfileId ? 'PUT' : 'POST';
      const body = { 
        name: newProfileName.trim(), 
        is_kids: kids, 
        avatar_url: selectedAvatar,
        ...(editingProfileId ? { id: editingProfileId } : {})
      };

      const res = await fetch('/api/profiles', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        setNewProfileName('');
        setBirthMonth('');
        setBirthYear('');
        setIsKids(false);
        setShowAddModal(false);
        setEditingProfileId(null);
        setIsEditing(false);
        await loadProfiles();
      } else {
        alert(payload.error || 'Erro ao salvar perfil');
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro de conexão ao salvar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este perfil? Todo o histórico dele será perdido.") || !token) return;

    try {
      const res = await fetch(`/api/profiles?id=${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingProfileId(null);
        await loadProfiles();
      }
    } catch (error) {
       console.error("Erro ao deletar perfil:", error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[100dvh] bg-black md:pl-[var(--sidebar-width)]">
        <ProfileHeader />
        <div className="flex items-center justify-center pt-32">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Render da Troca de Avatar (Tela Cheia)
  if (isChoosingAvatar) {
    return (
      <div className="fixed inset-0 z-[200] bg-[var(--bg-primary)] text-white overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500 font-sans">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20 lg:px-20">
          <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 sm:mb-10 bg-black/90 backdrop-blur-md flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => setIsChoosingAvatar(false)} 
              className="w-11 h-11 shrink-0 bg-white/5 hover:bg-white/10 rounded-full inline-flex items-center justify-center transition-all active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl md:text-5xl font-bold tracking-tight truncate">Escolha um ícone</h2>
              <p className="text-zinc-500 mt-0.5 sm:mt-2 text-sm sm:text-lg truncate">
                Avatar de {newProfileName || 'seu perfil'}
              </p>
            </div>
          </div>

          <div className="space-y-10 sm:space-y-16 md:space-y-20 pb-16 sm:pb-20">
            {AVATAR_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-left-5 duration-700">
                <div className="flex items-center gap-4 border-b border-white/5 pb-3 sm:pb-4">
                  <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
                    {category.name}
                  </h3>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-6 md:gap-8">
                  {category.avatars.map((avatar) => (
                    <button
                      type="button"
                      key={avatar.url}
                      onClick={() => { setSelectedAvatar(avatar.url); setIsChoosingAvatar(false); }}
                      className="group flex flex-col items-center gap-2 sm:gap-3 cursor-pointer"
                    >
                      <div className={cn(
                        "relative aspect-square w-full rounded-full overflow-hidden transition-all duration-300",
                        "border-2 sm:border-[3px]",
                        selectedAvatar === avatar.url 
                          ? "border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]" 
                          : "border-transparent group-active:scale-95"
                      )}>
                        <img 
                          src={avatar.url} 
                          alt={avatar.name} 
                          className={cn(
                            "w-full h-full object-cover transition-opacity duration-300",
                            selectedAvatar !== avatar.url && "opacity-70 group-hover:opacity-100"
                          )} 
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] sm:text-xs md:text-sm font-medium transition-colors text-center line-clamp-2 w-full px-0.5",
                        selectedAvatar === avatar.url ? "text-white" : "text-zinc-500 group-hover:text-zinc-200"
                      )}>
                        {avatar.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Criar / Editar perfil (estilo Disney+ — sem seletor de cores)
  if (showAddModal) {
    return (
      <div className="fixed inset-0 z-[150] bg-black text-white flex flex-col font-sans overflow-y-auto">
        <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6">
          <LogoLink size="md" />
          <div className="w-10" />
        </header>

        <div className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 md:pt-6">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight text-center mb-8 sm:mb-10 md:mb-14">
            {editingProfileId ? 'Editar perfil' : 'Criar perfil'}
          </h2>

          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-7 sm:gap-10 md:gap-14 items-start"
          >
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 sm:gap-5 mx-auto md:mx-0">
              <button
                type="button"
                onClick={() => setIsChoosingAvatar(true)}
                className="relative group"
                aria-label="Escolher avatar"
              >
                <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full p-[3px] bg-gradient-to-br from-white via-white/50 to-white/10 shadow-[0_0_40px_rgba(255,255,255,0.12)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#141414] relative">
                    {selectedAvatar ? (
                      <img
                        src={selectedAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/25">
                        <Camera size={40} strokeWidth={1.25} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/35 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit2 size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </button>

              <div className="w-full max-w-[260px] rounded-2xl bg-[#141414] border border-white/10 px-4 py-3 flex items-start gap-3">
                <Camera size={16} className="text-white/70 shrink-0 mt-0.5" />
                <p className="text-[11px] md:text-xs leading-relaxed text-white/55 text-left">
                  Toque na foto para escolher um personagem.
                </p>
              </div>
            </div>

            {/* Campos */}
            <div className="w-full space-y-8 sm:space-y-10 md:pt-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Nome</label>
                <input
                  autoFocus
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Nome do perfil"
                  className="w-full bg-transparent border-0 border-b border-white/40 focus:border-white py-2.5 text-base sm:text-lg md:text-xl text-white outline-none transition-colors placeholder:text-white/25"
                />
              </div>

              <div>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-white mb-4 sm:mb-5">
                  Data de nascimento (MM/AAAA)
                </p>
                <div className="grid grid-cols-2 gap-5 sm:gap-8 max-w-md">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Mês</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="MM"
                      className="w-full bg-transparent border-0 border-b border-white/40 focus:border-white py-2.5 text-base sm:text-lg text-white outline-none transition-colors placeholder:text-white/25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Ano</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="AAAA"
                      className="w-full bg-transparent border-0 border-b border-white/40 focus:border-white py-2.5 text-base sm:text-lg text-white outline-none transition-colors placeholder:text-white/25"
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs md:text-sm text-white/40 max-w-md leading-relaxed">
                  Usamos a idade para personalizar o conteúdo e as funcionalidades do perfil.
                </p>
              </div>

              {editingProfileId && (
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(editingProfileId)}
                  className="flex items-center gap-2 min-h-11 text-sm text-white/45 hover:text-white transition-colors"
                >
                  <Trash2 size={16} />
                  Excluir perfil
                </button>
              )}
            </div>
          </form>

          <div className="mt-10 sm:mt-auto pt-6 sm:pt-14 md:pt-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-lg pb-2">
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => handleSaveProfile()}
              className={cn(
                'w-full sm:w-auto sm:min-w-[200px] h-12 px-10 rounded-full text-sm font-bold tracking-wide transition-all active:scale-[0.98]',
                canContinue
                  ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
              )}
            >
              {isSaving ? 'Salvando...' : 'PRÓXIMO'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingProfileId(null);
                setBirthMonth('');
                setBirthYear('');
              }}
              className="w-full sm:w-auto sm:min-w-[200px] h-12 px-10 rounded-full text-sm font-bold tracking-wide bg-[#1a1a1a] hover:bg-[#252525] border border-white/15 text-white transition-all"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openAddProfile = () => {
    if (profiles.length >= 5) return;
    setEditingProfileId(null);
    setNewProfileName('');
    setSelectedAvatar(AVATAR_CATEGORIES[0].avatars[0].url);
    setBirthMonth('');
    setBirthYear('');
    setIsKids(false);
    setShowAddModal(true);
  };

  const selectedStored = getSelectedProfile();
  const current =
    profiles.find((p) => String(p.id) === String(selectedStored?.id)) || profiles[0] || null;
  const otherProfiles = profiles.filter((p) => String(p.id) !== String(current?.id));

  const renderProfileButton = (profile: any, size: 'lg' | 'sm' = 'sm') => {
    const large = size === 'lg';
    return (
      <div
        key={profile.id}
        className={cn(
          'flex flex-col items-center gap-2',
          large ? 'w-[128px] sm:w-[140px] md:w-[156px]' : 'w-[68px] md:w-[84px]'
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (isEditing) startEditingProfile(profile);
            else selectProfile(profile);
          }}
          className="relative group"
        >
          <div
            className={cn(
              'rounded-full overflow-hidden bg-[#222] flex items-center justify-center',
              'ring-2 transition-all duration-200 active:scale-95',
              large
                ? 'w-[128px] h-[128px] sm:w-[140px] sm:h-[140px] md:w-[156px] md:h-[156px] ring-white/80 shadow-[0_0_0_6px_rgba(255,255,255,0.06)]'
                : 'w-[68px] h-[68px] md:w-[84px] md:h-[84px] ring-transparent group-hover:ring-white/50'
            )}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={cn('font-bold text-white/80', large ? 'text-4xl md:text-5xl' : 'text-xl')}>
                {profile.name[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {isEditing && (
            <span className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#2a2a2a] border border-white/15 flex items-center justify-center shadow-lg">
              <Edit2 size={12} className="text-white" strokeWidth={2.25} />
            </span>
          )}
        </button>

        <span className="text-white text-xs md:text-base font-medium text-center truncate w-full">
          {profile.name}
        </span>
        {large && !isEditing && (
          <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-white/40">
            Atual
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col relative font-sans select-none md:pl-[var(--sidebar-width)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(255,255,255,0.07),transparent_55%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <ProfileHeader />

        <div className="flex-1 w-full max-w-[720px] mx-auto px-5 sm:px-6 md:px-10 pt-[calc(3.5rem+1.5rem)] md:pt-[calc(4.5rem+2rem)] pb-24 md:pb-16 flex flex-col items-center">
          <p className="text-sm md:text-base text-white/45 mb-8 md:mb-10 text-center">
            {isEditing ? 'Toque em um perfil para editar' : 'Quem está assistindo?'}
          </p>

          {current && (
            <div className="flex flex-col items-center mb-8 md:mb-10">
              {renderProfileButton(current, 'lg')}
            </div>
          )}

          <div className="w-full mb-10 md:mb-12">
            <div className="flex gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-1 justify-center">
              {otherProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-col items-center gap-1.5 w-[68px] sm:w-[76px] md:w-[84px] shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) startEditingProfile(profile);
                      else selectProfile(profile);
                    }}
                    className="relative group active:scale-95 transition-transform"
                  >
                    <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] md:w-[84px] md:h-[84px] rounded-full overflow-hidden bg-[#222] ring-1 ring-white/15 group-hover:ring-white/55 transition-all flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg md:text-xl font-bold text-white/80">
                          {profile.name[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {isEditing && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#2a2a2a] border border-white/15 flex items-center justify-center">
                        <Edit2 size={9} className="text-white" strokeWidth={2.25} />
                      </span>
                    )}
                  </button>
                  <span className="text-white/75 text-[11px] sm:text-xs font-medium text-center truncate w-full">
                    {profile.name}
                  </span>
                </div>
              ))}

              {profiles.length < 5 && (
                <button
                  type="button"
                  onClick={openAddProfile}
                  className="flex flex-col items-center gap-1.5 w-[68px] sm:w-[76px] md:w-[84px] shrink-0 active:scale-95 transition-transform"
                >
                  <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] md:w-[84px] md:h-[84px] rounded-full bg-[#171717] flex items-center justify-center hover:bg-[#222] ring-1 ring-white/12 transition-colors">
                    <Plus size={22} strokeWidth={1.5} className="text-white/85" />
                  </div>
                  <span className="text-white/75 text-[11px] sm:text-xs font-medium text-center">
                    Novo
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-md">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 px-6 py-3.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-colors active:scale-[0.98]"
            >
              {isEditing ? 'Concluído' : 'Gerenciar perfis'}
            </button>
            <Link
              href="/profile"
              className="flex-1 px-6 py-3.5 rounded-xl border border-white/15 text-center text-white/85 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
            >
              Conta e histórico
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
