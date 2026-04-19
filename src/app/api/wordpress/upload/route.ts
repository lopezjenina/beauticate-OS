import { NextResponse } from 'next/server';
import { uploadDraftToWordPress } from '@/lib/wordpress';

export async function POST(request: Request) {
  try {
    const postData = await request.json();
    
    if (!postData.title || !postData.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const result = await uploadDraftToWordPress(postData);

    return NextResponse.json({ 
      success: true, 
      postId: result.id, 
      url: result.link 
    });
  } catch (error: any) {
    console.error('WordPress Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload to WordPress' },
      { status: 500 }
    );
  }
}
