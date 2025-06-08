import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import ImageKit from 'imagekit';

//imagekit configuration
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
});

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({
                error: 'Unauthorized',
            }, {
                status: 401,
            });
        }

        //parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const parentId = formData.get('parentId') as string | null;
        const formUserId = formData.get('userId') as string;

        if(formUserId !== userId) {
            return NextResponse.json({
                error: 'Unauthorized',
            }, {
                status: 401,
            });
        }

        if (!file || !(file instanceof File)) {
            return NextResponse.json({
                error: 'No file provided or invalid file type',
            }, {
                status: 400,
            });
        }
    
        if(parentId) {
            const [parentFolder] = await db.select().from(files).where(
                and(
                    eq(files.id, parentId),
                    eq(files.userId, userId),
                    eq(files.isFolder, true)
                )
            );
        } 
        
        if(!parentId) {
            return NextResponse.json({
                error: 'Parent folder not found',
            }, {
                status: 404,
            });
        }

        if(file.type.startsWith('image/') && file.type !== 'application/pdf') {
            return NextResponse.json({
                error: 'Only images and PDFs are allowed',
            }, {
                status: 400,
            });
        }

        const buffer = await file.arrayBuffer(); // Ensure the file is read correctly
        const fileBuffer = Buffer.from(buffer);

        const folderPath = parentId ? `/droply/${userId}/folder/${parentId}` : `/droply/${userId}`;

        const originalFileName = file.name;
        const fileExtension = originalFileName.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        const uploadResponse = await imagekit.upload({
            file: fileBuffer,
            fileName: uniqueFileName,
            folder: folderPath,
            useUniqueFileName: false,
        });

        const fileData = {
            name: originalFileName,
            path: uploadResponse.filePath,
            size: file.size,
            type: file.type,
            fileUrl: uploadResponse.url,
            thumbnailUrl: uploadResponse.thumbnailUrl || null,
            userId: userId,
            parentId: parentId || null,
            isFolder: false,
            isStarred: false,
            isTrashed: false,
        }

        const [newFile] = await db.insert(files).values(fileData).returning();

        return NextResponse.json(newFile);
    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}