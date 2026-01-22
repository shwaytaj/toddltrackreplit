import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  childId: string;
  onUploadComplete?: (analysisId: string) => void;
}

export default function VideoUpload({ childId, onUploadComplete }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`/api/children/${childId}/videos`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Video uploaded',
        description: 'Your video is being analyzed. This may take a minute.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'videos'] });
      setSelectedFile(null);
      setPreview(null);
      if (onUploadComplete) {
        onUploadComplete(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a video under 50MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, [toast]);

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a video under 50MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, [toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Auto Milestone Detection</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Upload a short video (30-60 seconds) of your child playing or doing activities. 
          Our AI will analyze the video and automatically detect developmental milestones.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-video-file"
        />

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary hover:bg-muted/50",
              "border-muted-foreground/25"
            )}
            data-testid="dropzone-video"
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Click or drag to upload a video</p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4, MOV, WebM, or AVI (max 50MB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              {preview && (
                <video
                  src={preview}
                  className="w-full h-full object-contain"
                  controls
                  data-testid="video-preview"
                />
              )}
              {!uploadMutation.isPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleClear}
                  data-testid="button-clear-video"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>

            {uploadMutation.isPending && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading and analyzing...</span>
                </div>
              </div>
            )}

            {uploadMutation.isSuccess && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Analysis started! Check results below.</span>
              </div>
            )}

            {uploadMutation.isError && (
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Upload failed. Please try again.</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="w-full"
              data-testid="button-analyze-video"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Analyze Video
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Videos are deleted immediately after analysis
          </p>
          <p className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Only analysis results are stored
          </p>
        </div>
      </div>
    </Card>
  );
}
