import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pageTitle: z.string(),
    description: z.string(),
    canonical: z.string(),
    type: z.enum(['legal', 'blog']),
    date: z.string().optional(),
    ogImage: z.string().optional(),
  }),
});

const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pageTitle: z.string(),
    description: z.string(),
    canonical: z.string(),
    group: z.enum(['osgb', 'kurumsal', 'bireysel']),
    categoryLabel: z.string(),
    price: z.string(),
    originalPrice: z.string().optional(),
    discountPercent: z.string().optional(),
    activation: z.string().optional(),
    image: z.string().optional(),
    note: z.string().optional(),
    sections: z.array(
      z.object({
        title: z.string(),
        items: z.array(
          z.object({
            name: z.string(),
            value: z.union([z.string(), z.boolean()]),
          })
        ),
      })
    ),
  }),
});

export const collections = { pages, products };
