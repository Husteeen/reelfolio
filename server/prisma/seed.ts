import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Film',         slug: 'film' },
  { name: 'Commercial',   slug: 'commercial' },
  { name: 'Music Video',  slug: 'music-video' },
  { name: 'Documentary',  slug: 'documentary' },
  { name: 'Travel',       slug: 'travel' },
  { name: 'Event',        slug: 'event' },
  { name: 'Animation',    slug: 'animation' },
  { name: 'Photography',  slug: 'photography' },
  { name: 'Tutorial',     slug: 'tutorial' },
  { name: 'Other',        slug: 'other' },
];

async function main() {
  console.log('🌱  Seeding categories…');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅  Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
