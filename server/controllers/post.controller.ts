//IMPORTS
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { uploadToCloudinary } from '../utils/cloudinary';

// CREATE POST VALIDATION SCHEMA
const createPostSchema = z.object({
  caption: z.string().optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'REEL']),
});

//UPDATE POST SCHEMA
const updatePostSchema = z.object({
  caption: z.string().optional(),
  media: z.any().optional(),
});

// CREATE POST
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const parsedData = createPostSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ success: false, errors: parsedData.error.issues });
      return;
    }

    const { caption, type } = parsedData.data;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Media file is required' });
      return;
    }

    // UPLOAD TO CLOUDINARY
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
    const mediaUrl = cloudinaryResult.secure_url;

    const newPost = await prisma.post.create({
      data: {
        authorId: userId,
        caption,
        type,
        media: mediaUrl,
      },
    });

    res.status(201).json({
      success: true,
      data: newPost,
      message: 'Post created successfully',
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error?.message });
  }
};

// GET ALL POSTS (WITH PAGINATION OR USER FILTER)
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { authorId, limit = '20', cursor } = req.query;

    const posts = await prisma.post.findMany({
      where: authorId ? { authorId: String(authorId) } : undefined,
      take: Number(limit),
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error: any) {
    console.error('Get all posts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error?.message });
  }
};

// GET SINGLE POST
export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // OPTIONALLY INCREMENT VIEW COUNT HERE (CAN BE OPTIMIZED VIA RAW QUERY OR QUEUE SO IT DOESN'T BLOCK)
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error?.message });
  }
};

// UPDATE POST
export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const parsedData = updatePostSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ success: false, errors: parsedData.error.issues });
      return;
    }

    // CHECK IF THE POST EXISTS AND BELONGS TO THE USER
    const existingPost = await prisma.post.findUnique({ where: { id } });

    if (!existingPost) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (existingPost.authorId !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own posts' });
      return;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: parsedData.data,
    });

    res.status(200).json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully',
    });
  } catch (error: any) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error?.message });
  }
};

// DELETE POST
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // CHECK IF THE POST EXISTS AND BELONGS TO THE USER
    const existingPost = await prisma.post.findUnique({ where: { id } });

    if (!existingPost) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (existingPost.authorId !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own posts' });
      return;
    }

    await prisma.post.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error?.message });
  }
};
