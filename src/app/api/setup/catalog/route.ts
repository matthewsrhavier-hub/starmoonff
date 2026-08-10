import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Cria as tabelas movies e series no Supabase via SQL direto
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== 'superflix-setup-2024') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const logs: string[] = [];

  try {
    logs.push('Criando tabela movies...');
    const { error: moviesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS movies (
          id SERIAL PRIMARY KEY,
          tmdb_id INTEGER UNIQUE NOT NULL,
          title VARCHAR(500) NOT NULL,
          overview TEXT,
          poster_url VARCHAR(500),
          backdrop_url VARCHAR(500),
          release_date DATE,
          rating REAL DEFAULT 0,
          genres JSONB DEFAULT '[]',
          embed_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
        CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created_at DESC);
      `
    });

    if (moviesError) {
      logs.push(`Aviso movies: ${moviesError.message}`);
    } else {
      logs.push('✅ Tabela movies OK');
    }

    logs.push('Criando tabela series...');
    const { error: seriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS series (
          id SERIAL PRIMARY KEY,
          tmdb_id INTEGER UNIQUE NOT NULL,
          title VARCHAR(500) NOT NULL,
          overview TEXT,
          poster_url VARCHAR(500),
          backdrop_url VARCHAR(500),
          release_date DATE,
          rating REAL DEFAULT 0,
          genres JSONB DEFAULT '[]',
          embed_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_series_tmdb_id ON series(tmdb_id);
        CREATE INDEX IF NOT EXISTS idx_series_created ON series(created_at DESC);
      `
    });

    if (seriesError) {
      logs.push(`Aviso series: ${seriesError.message}`);
    } else {
      logs.push('✅ Tabela series OK');
    }

    // Verificar se as tabelas existem fazendo um select
    const { data: movieCount, error: checkError } = await supabase
      .from('movies')
      .select('id', { count: 'exact', head: true });
    
    if (checkError) {
      logs.push(`❌ Tabela movies ainda não acessível: ${checkError.message}`);
      logs.push('👉 Crie as tabelas manualmente no Supabase SQL Editor usando o arquivo: database/create_catalog_tables.sql');
    } else {
      logs.push('✅ Tabela movies acessível!');
    }

    const { data: seriesCount, error: checkSeriesError } = await supabase
      .from('series')
      .select('id', { count: 'exact', head: true });

    if (checkSeriesError) {
      logs.push(`❌ Tabela series ainda não acessível: ${checkSeriesError.message}`);
    } else {
      logs.push('✅ Tabela series acessível!');
    }

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    logs.push(`Erro: ${err.message}`);
    return NextResponse.json({ success: false, logs, error: err.message }, { status: 500 });
  }
}
