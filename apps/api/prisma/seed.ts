import { PrismaClient, Interest, ConnectionIntent, Gender, Temperament, Vaccinated } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(data: {
  email: string;
  fullName: string;
  handle: string;
  password: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  interests?: Interest[];
  connectionIntents?: ConnectionIntent[];
  pet?: {
    name: string;
    breed?: string;
    bio?: string;
    photoUrl?: string;
  };
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.upsert({
    where: { email: data.email },
    create: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      handle: data.handle,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      onboardingComplete: true,
      verified: true,
      interests: data.interests
        ? { create: data.interests.map((interest) => ({ interest })) }
        : undefined,
      connectionIntents: data.connectionIntents
        ? { create: data.connectionIntents.map((intent) => ({ intent })) }
        : undefined,
      pet: data.pet
        ? {
            create: {
              name: data.pet.name,
              breed: data.pet.breed,
              bio: data.pet.bio,
              photoUrl: data.pet.photoUrl,
              temperament: [Temperament.Happy],
              vaccinated: Vaccinated.Yes,
              gender: Gender.Male,
            },
          }
        : undefined,
    },
    update: {
      fullName: data.fullName,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      onboardingComplete: true,
    },
    include: { pet: true },
  });
  return user;
}

async function main() {
  const jefferson = await upsertUser({
    email: 'jefferson@paw.test',
    fullName: 'Jefferson',
    handle: 'jefferson',
    password: 'password123',
    location: 'Austin, TX',
    latitude: 30.2672,
    longitude: -97.7431,
    interests: [Interest.DogPlaydates, Interest.Friendship],
    connectionIntents: [ConnectionIntent.Friendship, ConnectionIntent.MeetPeople],
    pet: {
      name: 'Pluto',
      breed: 'Golden Retriever',
      bio: 'Loves the park!',
    },
  });

  const sarah = await upsertUser({
    email: 'sarah@paw.test',
    fullName: 'Sarah',
    handle: 'sarah',
    password: 'password123',
    location: 'Austin, TX',
    latitude: 30.27,
    longitude: -97.74,
    interests: [Interest.Friendship, Interest.DogFriendlyLocations],
    connectionIntents: [ConnectionIntent.Friendship, ConnectionIntent.MeetPeople],
    pet: {
      name: 'Luna',
      breed: 'Husky',
      bio: 'Playful and friendly',
    },
  });

  const neo = await upsertUser({
    email: 'neo@paw.test',
    fullName: 'Neo',
    handle: 'neo',
    password: 'password123',
    location: 'Austin, TX',
    latitude: 30.265,
    longitude: -97.745,
    interests: [Interest.AllTheAbove],
    connectionIntents: [ConnectionIntent.Friendship, ConnectionIntent.MeetPeople],
    pet: {
      name: 'Phoebe',
      breed: 'Mixed',
      bio: 'Walking buddy',
    },
  });

  await prisma.connectionRequest.upsert({
    where: {
      senderId_recipientId_type: {
        senderId: sarah.id,
        recipientId: neo.id,
        type: 'friendship',
      },
    },
    create: {
      senderId: sarah.id,
      recipientId: neo.id,
      type: 'friendship',
      status: 'pending',
    },
    update: { status: 'pending' },
  });

  await prisma.connectionRequest.upsert({
    where: {
      senderId_recipientId_type: {
        senderId: jefferson.id,
        recipientId: neo.id,
        type: 'friendship',
      },
    },
    create: {
      senderId: jefferson.id,
      recipientId: neo.id,
      type: 'friendship',
      status: 'pending',
    },
    update: { status: 'pending' },
  });

  const existingPost = await prisma.post.findFirst({
    where: { authorId: jefferson.id },
  });
  if (!existingPost) {
    await prisma.post.create({
      data: {
        authorId: jefferson.id,
        body: 'Pluto had an amazing day at the dog park!',
        images: {
          create: [
            {
              url: 'https://placehold.co/600x400/orange/white?text=Pluto',
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }

  console.log('Seed completed:', {
    users: [jefferson.handle, sarah.handle, neo.handle],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
