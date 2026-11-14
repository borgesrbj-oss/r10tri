export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const { fileName, contentType } = await req.json();
  if (!fileName || !contentType) return NextResponse.json({ error: 'fileName e contentType obrigatorios' }, { status: 400 });
  if (!String(contentType).startsWith('image/')) return NextResponse.json({ error: 'Apenas imagens sao permitidas' }, { status: 400 });
  const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(fileName, contentType, true);
  const publicUrl = await getFileUrl(cloud_storage_path, contentType, true);
  return NextResponse.json({ uploadUrl, cloud_storage_path, publicUrl });
}
