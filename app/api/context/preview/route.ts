// API Route for Context Preview
import { NextRequest, NextResponse } from 'next/server';
import { loadACMContext, CONTEXT_STRATEGIES, type ContextLevel } from '@/lib/contextLoader';

// GET /api/context/preview?level=<standard|deep|minimal> - Preview what context will be loaded
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = (searchParams.get('level') || 'standard') as ContextLevel;

    if (!['minimal', 'standard', 'deep'].includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid context level. Must be: minimal, standard, or deep' },
        { status: 400 }
      );
    }

    const strategy = CONTEXT_STRATEGIES[level];
    const { context, entries } = await loadACMContext(level);

    return NextResponse.json({
      success: true,
      level,
      strategy: {
        description: strategy.description,
        maxTokens: strategy.maxTokens,
        categories: strategy.categories
      },
      preview: {
        entryCount: entries.length,
        totalTokens: Math.ceil(context.length / 4),
        entries: entries.map(e => ({
          id: e.id,
          title: e.title,
          category: `${e.category}:${e.subcategory}`,
          importance: e.importance_score,
          tokens: e.token_count,
          contentPreview: e.content.substring(0, 200) + '...'
        })),
        contextPreview: context.substring(0, 1000) + '...'
      }
    });
  } catch (error: any) {
    console.error('Error previewing context:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
