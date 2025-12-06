import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Instagram, Linkedin, Settings, MapPin, Heart, Users, Sparkles } from "lucide-react";
import userProfileImage from "@/assets/user-profile.jpg";

export const Profile = () => {
  const userProfile = {
    name: "Alex Morgan",
    age: 27,
    location: "NYC, Manhattan",
    bio: "Tech enthusiast | Runner | Coffee lover ☕ | Always looking to connect with like-minded people",
    interests: ["Running", "Technology", "Coffee", "Photography", "Startups", "Fitness"],
    platforms: {
      instagram: "https://instagram.com/yourprofile",
      linkedin: "https://linkedin.com/in/yourprofile"
    },
    imageUrl: userProfileImage,
    stats: {
      connections: 48,
      vibeMatches: 24,
      meetups: 12
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border-primary/20">
          <div className="h-32 bg-primary" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
              <Avatar className="w-32 h-32 border-4 border-background shadow-glow">
                <AvatarImage src={userProfile.imageUrl} />
                <AvatarFallback className="text-2xl bg-accent text-white">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h2 className="text-2xl font-bold">{userProfile.name}, {userProfile.age}</h2>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{userProfile.location}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground">{userProfile.bio}</p>
              </div>

              <Button className="bg-primary hover:opacity-90">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userProfile.stats.connections}</p>
                  <p className="text-sm text-muted-foreground">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userProfile.stats.vibeMatches}</p>
                  <p className="text-sm text-muted-foreground">Vibe Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userProfile.stats.meetups}</p>
                  <p className="text-sm text-muted-foreground">Meetups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interests */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userProfile.interests.map((interest) => (
                <Badge 
                  key={interest} 
                  variant="secondary" 
                  className="bg-primary/10 text-primary border-primary/20 text-sm"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Connected Platforms */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Instagram</p>
                  <p className="text-sm text-muted-foreground">@yourprofile</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary">
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">LinkedIn</p>
                  <p className="text-sm text-muted-foreground">@yourprofile</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              Privacy & Safety
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start">
              Notifications
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start">
              Account Settings
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
