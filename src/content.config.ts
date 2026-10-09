import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections for The Franklin Desha House.
 *
 * To add a room or family member, drop a Markdown file into
 * src/content/rooms/ or src/content/family/ — it appears on the site
 * automatically (see README.md for the one-page guide).
 */

const rooms = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/rooms' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Controls the order rooms appear in the tour (lower = earlier).
    order: z.number().default(99),
    // Whether this room gets a printed QR card. Set false to skip.
    qr: z.boolean().default(true),
    // e.g. "The central breezeway" — short label used on cards.
    roomArea: z.string().optional(),
    // Optional photo in src/assets or public — not yet wired to a photo pipeline.
    photo: z.string().optional(),
  }),
});

const family = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/family' }),
  schema: z.object({
    name: z.string(),
    born: z.string().optional(),
    died: z.string().optional(),
    relationship: z.string().optional(),
    order: z.number().default(99),
    photo: z.string().optional(),
  }),
});

export const collections = { rooms, family };
