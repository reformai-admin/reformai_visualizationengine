// Multipart form parser.
// Single responsibility: iterate multipart fields, buffer binary image data,
// and return raw typed buckets. No validation, no schema checks, no lookups.

import type { MultipartFile, Multipart } from '@fastify/multipart';
import { ValidationError } from '../../shared/validation/validation.utils.js';

export interface RawFormFiles {
    roomImage: MultipartFile & { buffer: Buffer };
    moodBoardImages: (MultipartFile & { buffer: Buffer })[];
    furnitureImage?: MultipartFile & { buffer: Buffer };
    previousResultImage?: MultipartFile & { buffer: Buffer };
}

export interface RawFormData {
    fields: Record<string, string | boolean>;
    files: RawFormFiles;
}

export const parseMultipartForm = async (
    parts: AsyncIterableIterator<Multipart>,
): Promise<RawFormData> => {
    const fields: Record<string, string | boolean> = {};
    const rawFiles: Record<string, MultipartFile | MultipartFile[]> = {};

    for await (const part of parts) {
        const fieldName = part.fieldname;
        if (part.type === 'file') {
            const buffer = await part.toBuffer();
            const fileWithBuffer = { ...part, buffer };
            if (fieldName === 'moodBoardImages') {
                if (!rawFiles[fieldName]) rawFiles[fieldName] = [];
                (rawFiles[fieldName] as MultipartFile[]).push(fileWithBuffer as any);
            } else {
                rawFiles[fieldName] = fileWithBuffer as any;
            }
        } else {
            fields[fieldName] = (part.value === 'true' || part.value === 'false')
                ? part.value === 'true'
                : part.value as string;
        }
    }

    const roomImage = rawFiles['roomImage'] as (MultipartFile & { buffer: Buffer });
    if (!roomImage) throw new ValidationError('El campo "roomImage" es requerido');

    return {
        fields,
        files: {
            roomImage,
            moodBoardImages: (rawFiles['moodBoardImages'] as (MultipartFile & { buffer: Buffer })[]) || [],
            furnitureImage: rawFiles['furnitureImage'] as (MultipartFile & { buffer: Buffer }) | undefined,
            previousResultImage: rawFiles['previousResultImage'] as (MultipartFile & { buffer: Buffer }) | undefined,
        },
    };
};


