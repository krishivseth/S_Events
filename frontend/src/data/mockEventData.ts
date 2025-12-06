import { CommunicationProfile, Event } from '@/types/event';

const avatars = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
];

const schools = [
  'Stanford University', 'MIT', 'Harvard University', 'Yale University', 
  'UC Berkeley', 'Columbia University', 'NYU', 'Princeton University',
  'University of Michigan', 'UCLA'
];

const roles = [
  'Founder & CEO', 'Software Engineer', 'Product Manager', 'Designer',
  'Venture Partner', 'Student', 'Consultant', 'Marketing Director',
  'Data Scientist', 'Operations Lead'
];

const companies = [
  'Stealth Startup', 'Google', 'Meta', 'Stripe', 'OpenAI', 'Anthropic',
  'a16z', 'Sequoia', 'YC', 'Series'
];

const names = [
  'Marcus Chen', 'Lisa Rodriguez', 'Alex Thompson', 'Sarah Kim', 'David Patel',
  'Emma Wilson', 'James Liu', 'Olivia Martinez', 'Michael Brown', 'Sophia Lee',
  'Daniel Garcia', 'Isabella Taylor', 'William Anderson', 'Mia Johnson', 'Benjamin Davis',
  'Charlotte Moore', 'Ethan Jackson', 'Amelia White', 'Alexander Harris', 'Harper Martin'
];

const bios = [
  "Building the future of social networking. Previously founded 2 startups.",
  "Stanford CS grad passionate about AI and startups. Let's connect!",
  "Product at Google, angel investor on the side. Love meeting new founders.",
  "Designer turned founder. Building tools for creators.",
  "VC at a16z. Always looking for the next big thing.",
  "NYU student studying CS and Economics. Working on impactful projects.",
  "Former McKinsey, now helping startups scale operations.",
  "Full-stack engineer who loves building products people actually use.",
  "Marketing leader with 10+ years in tech. Passionate about growth.",
  "Data scientist exploring the intersection of AI and healthcare.",
];

export const mockProfiles: CommunicationProfile[] = names.map((name, index) => {
  const genders: ('male' | 'female' | 'other')[] = ['male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female'];
  
  return {
    userId: `user-${index + 1}`,
    name,
    avatar: avatars[index],
    age: 21 + Math.floor(Math.random() * 15),
    gender: genders[index],
    school: schools[index % schools.length],
    role: roles[index % roles.length],
    company: companies[index % companies.length],
    bio: bios[index % bios.length],
    connectionDegree: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
    alreadyKnow: Math.random() > 0.7,
    linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`
  };
});

// Make some profiles more interesting for demo
mockProfiles[0] = {
  ...mockProfiles[0],
  age: 28,
  role: 'Founder & CEO',
  company: 'Stealth Startup',
  school: 'Stanford University',
  connectionDegree: 2,
  alreadyKnow: false,
  bio: "Serial entrepreneur, 2x founder. Building the future of social networking."
};

mockProfiles[1] = {
  ...mockProfiles[1],
  age: 26,
  role: 'Venture Partner',
  company: 'a16z',
  school: 'Harvard University',
  connectionDegree: 3,
  alreadyKnow: false,
  bio: "VC at a16z focused on consumer and social. Previously PM at Meta."
};

mockProfiles[2] = {
  ...mockProfiles[2],
  age: 21,
  role: 'Student',
  company: 'NYU',
  school: 'NYU',
  connectionDegree: 1,
  alreadyKnow: true,
  bio: "I'm Alex, 21, building impactful stuff while studying CS at NYU. Let's change the world!"
};

// Current user profile for display on privacy/profile pages
export const currentUserProfile: CommunicationProfile = {
  userId: 'current-user',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
  age: 21,
  gender: 'male',
  school: 'NYU',
  role: 'CS Student & Founder',
  company: 'NYU',
  bio: "Studying CS at NYU while building tech startups. Passionate about connecting people through technology.",
  connectionDegree: 1,
  alreadyKnow: false,
  linkedinUrl: 'https://linkedin.com/in/you'
};

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Founder Dinner - Series A Celebration',
    description: 'An intimate dinner for founders who recently closed their Series A. Share war stories and celebrate wins.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    host: 'user-1',
    type: 'private',
    maxAttendees: 10,
    guests: [],
    chemistryScore: 0
  },
  {
    id: 'event-2',
    title: 'Tech & Wine Meetup',
    description: 'Casual networking over wine tasting. Meet fellow tech enthusiasts in a relaxed setting.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    host: 'user-2',
    type: 'public',
    maxAttendees: 25,
    guests: [],
    chemistryScore: 0
  }
];

// Pre-calculated pairwise chemistry for demo based on new criteria
export const pairwiseChemistryMap: Record<string, number> = {};

// Generate pairwise scores based on new criteria
mockProfiles.forEach((profile1, i) => {
  mockProfiles.forEach((profile2, j) => {
    if (i < j) {
      const key = `${profile1.userId}_${profile2.userId}`;
      
      let score = 60; // Base score
      
      // Same school bonus
      if (profile1.school === profile2.school) score += 15;
      
      // Similar age bonus (within 5 years)
      if (Math.abs(profile1.age - profile2.age) <= 5) score += 10;
      
      // Same gender slight bonus
      if (profile1.gender === profile2.gender) score += 5;
      
      // Already know each other - big bonus
      if (profile1.alreadyKnow && profile2.alreadyKnow) score += 10;
      
      // 1st degree connections are better
      if (profile1.connectionDegree === 1 || profile2.connectionDegree === 1) score += 8;
      else if (profile1.connectionDegree === 2 || profile2.connectionDegree === 2) score += 4;
      
      // Same industry/role type bonus
      if (profile1.role === profile2.role) score += 5;
      
      // Add some randomness
      score += Math.random() * 10 - 5;
      
      pairwiseChemistryMap[key] = Math.min(98, Math.max(45, Math.round(score)));
    }
  });
});
