import { useState } from 'react';
import { Upload, Sparkles, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface CoverImagePickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const presetGradients = [
  'bg-gradient-to-br from-rose-500/40 via-pink-500/30 to-purple-600/40',
  'bg-gradient-to-br from-blue-500/40 via-cyan-500/30 to-teal-500/40',
  'bg-gradient-to-br from-orange-500/40 via-amber-500/30 to-yellow-500/40',
  'bg-gradient-to-br from-violet-500/40 via-purple-500/30 to-fuchsia-500/40',
  'bg-gradient-to-br from-emerald-500/40 via-green-500/30 to-lime-500/40',
  'bg-gradient-to-br from-indigo-500/40 via-blue-500/30 to-sky-500/40',
];

const presetImages = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop',
];

export function CoverImagePicker({ value, onChange, className }: CoverImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        setIsOpen(false);
        toast({ title: "Cover uploaded!", description: "Your cover image has been set." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the image you want to generate." });
      return;
    }
    
    setIsGenerating(true);
    // Simulate AI generation - in real app would call API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use a random preset image as placeholder for generated
    const randomImage = presetImages[Math.floor(Math.random() * presetImages.length)];
    onChange(randomImage);
    setIsGenerating(false);
    setIsOpen(false);
    toast({ title: "Image generated!", description: "Your AI cover has been created." });
  };

  const isGradient = value?.startsWith('bg-gradient');
  const isImage = value && !isGradient;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div 
          className={`relative cursor-pointer group overflow-hidden rounded-xl ${className}`}
        >
          {isImage ? (
            <img 
              src={value} 
              alt="Event cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${value || 'bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30'}`} />
          )}
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Image className="w-4 h-4" />
              Change Cover
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose Cover Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Upload Image</Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload an image</span>
              </label>
            </div>
          </div>

          {/* AI Generate Section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Generate with AI</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Describe your event cover..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Preset Images */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Stock Images</Label>
            <div className="grid grid-cols-3 gap-2">
              {presetImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onChange(img);
                    setIsOpen(false);
                  }}
                  className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Preset Gradients */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Gradients</Label>
            <div className="grid grid-cols-6 gap-2">
              {presetGradients.map((gradient, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onChange(gradient);
                    setIsOpen(false);
                  }}
                  className={`aspect-square rounded-lg ${gradient} border-2 border-transparent hover:border-primary transition-colors`}
                />
              ))}
            </div>
          </div>

          {/* Clear */}
          {value && (
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Remove Cover
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
