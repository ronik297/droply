import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(request: NextRequest, props:{
    params: Promise<{fileId: string}>
}) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({
                error: 'Unauthorized',
            }, {
                status: 401,
            });
        }

        const { fileId } = await props.params;

        if(!fileId) {
            return NextResponse.json({
                error: 'File ID is required',
            }, {
                status: 400,
            });
        }

        const [file] = await db.select().from(files).where(
            and(
                eq(files.id, fileId),
                eq(files.userId, userId)
            )
        );

        if (!file) {
            return NextResponse.json({
                error: 'File not found',
            }, {
                status: 404,
            });
        }

        //toggle the star
        const updatedFiles = await db.update(files).set({ isStarred: !file.isStarred }).where(and(eq(files.id, fileId), 
        eq(files.userId, userId))).returning();

        const updatedFile = updatedFiles[0];
        return NextResponse.json(updatedFile);
    } catch (error) {
        console.error("Error toggling file star:", error);
        return NextResponse.json({ error: "Failed to toggle file star" }, { status: 500 });
    }
}