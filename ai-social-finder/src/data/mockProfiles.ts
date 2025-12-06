import profileAlex from "@/assets/profile-alex.jpg";
import profileMaya from "@/assets/profile-maya.jpg";
import profileJordan from "@/assets/profile-jordan.jpg";
import profileSam from "@/assets/profile-sam.jpg";
import profileRiley from "@/assets/profile-riley.jpg";
import profileCasey from "@/assets/profile-casey.jpg";

export interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  vibeMatch: number;
  platforms: {
    instagram?: string;
    linkedin?: string;
  };
  imageUrl: string;
  mutualConnection?: string;
}

export const mockProfiles: Profile[] = [
  {
    id: "1",
    name: "Alex Chen",
    age: 28,
    location: "NYC, Manhattan",
    bio: "Marathon runner 🏃‍♂️ | Tech enthusiast | Coffee addict ☕ | Always up for morning runs in Central Park",
    interests: ["Running", "Technology", "Coffee", "Photography", "Startups"],
    vibeMatch: 94,
    platforms: {
      instagram: "https://instagram.com/alexchen",
      linkedin: "https://linkedin.com/in/alexchen"
    },
    imageUrl: profileAlex,
    mutualConnection: "Sarah Martinez"
  },
  {
    id: "2",
    name: "Maya Patel",
    age: 26,
    location: "NYC, Brooklyn",
    bio: "Product designer at a fintech startup | Weekend warrior 💪 | Love exploring new restaurants and running trails",
    interests: ["Design", "Fitness", "Food", "Running", "Music"],
    vibeMatch: 89,
    platforms: {
      instagram: "https://instagram.com/mayapatel",
      linkedin: "https://linkedin.com/in/mayapatel"
    },
    imageUrl: profileMaya,
    mutualConnection: "Jordan Lee"
  },
  {
    id: "3",
    name: "Jordan Rivers",
    age: 30,
    location: "NYC, Queens",
    bio: "Software engineer by day, 5K enthusiast by sunrise 🌅 | Building in Web3 | Always down for a running buddy",
    interests: ["Running", "Web3", "Gaming", "Hiking", "Tech"],
    vibeMatch: 92,
    platforms: {
      instagram: "https://instagram.com/jordanrivers",
      linkedin: "https://linkedin.com/in/jordanrivers"
    },
    imageUrl: profileJordan
  },
  {
    id: "4",
    name: "Sam Torres",
    age: 27,
    location: "NYC, Manhattan",
    bio: "Marketing manager | Half-marathon PR chaser 🏃 | Brunch enthusiast | Let's hit the Hudson River path!",
    interests: ["Running", "Marketing", "Brunch", "Yoga", "Travel"],
    vibeMatch: 87,
    platforms: {
      instagram: "https://instagram.com/samtorres",
      linkedin: "https://linkedin.com/in/samtorres"
    },
    imageUrl: profileSam,
    mutualConnection: "Alex Chen"
  },
  {
    id: "5",
    name: "Riley Kim",
    age: 29,
    location: "NYC, Brooklyn",
    bio: "Data scientist | Ultra runner training for NYC marathon 🏃‍♀️ | Love data viz and long conversations over coffee",
    interests: ["Running", "Data Science", "Coffee", "Books", "Music"],
    vibeMatch: 91,
    platforms: {
      instagram: "https://instagram.com/rileykim",
      linkedin: "https://linkedin.com/in/rileykim"
    },
    imageUrl: profileRiley
  },
  {
    id: "6",
    name: "Casey Martinez",
    age: 25,
    location: "NYC, Manhattan",
    bio: "Creative director | Morning run = best ideas 💡 | Passionate about sustainability and design thinking",
    interests: ["Design", "Running", "Sustainability", "Art", "Fashion"],
    vibeMatch: 85,
    platforms: {
      instagram: "https://instagram.com/caseymartinez",
      linkedin: "https://linkedin.com/in/caseymartinez"
    },
    imageUrl: profileCasey,
    mutualConnection: "Maya Patel"
  }
];
