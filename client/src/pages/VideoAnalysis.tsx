import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import BottomNav, { type NavPage } from '@/components/BottomNav';
import VideoUpload from '@/components/VideoUpload';
import {
  ArrowLeft,
  Video,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectedActivity {
  timestamp: string;
  activity: string;
  category: string;
  confidence: number;
}

interface MilestoneMatch {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneCategory: string;
  confidence: number;
  videoTimestamp: string;
  activityDescription: string;
  autoAchieved: boolean;
  parentConfirmed: boolean | null;
}

interface VideoRecommendation {
  title: string;
  description: string;
  relatedMilestones: string[];
  priority: "high" | "medium" | "low";
}

interface VideoAnalysisResult {
  id: string;
  status: string;
  originalFilename: string;
  videoDuration: number | null;
  uploadedAt: string;
  analyzedAt: string | null;
  videoDeletedAt: string | null;
  errorMessage: string | null;
  detectedActivities: DetectedActivity[];
  matchedMilestones: MilestoneMatch[];
  recommendations: VideoRecommendation[];
}

interface VideoAnalysisSummary {
  id: string;
  originalFilename: string;
  status: string;
  uploadedAt: string;
  analyzedAt: string | null;
  matchedMilestonesCount: number;
}

export default function VideoAnalysis() {
  const { id: videoId } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { activeChildId } = useActiveChild();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingConfirmations, setPendingConfirmations] = useState<Record<string, boolean>>({});

  const handleNavigation = (page: NavPage) => {
    switch (page) {
      case 'home':
        navigate('/home');
        break;
      case 'milestones':
        navigate('/milestones');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  const { data: analyses, isLoading: isLoadingList } = useQuery<{ analyses: VideoAnalysisSummary[] }>({
    queryKey: ['/api/children', activeChildId, 'videos'],
    enabled: !!activeChildId && !videoId,
  });

  const { data: analysis, isLoading: isLoadingDetail, refetch } = useQuery<VideoAnalysisResult>({
    queryKey: ['/api/children', activeChildId, 'videos', videoId],
    enabled: !!activeChildId && !!videoId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'processing' || status === 'analyzing' || status === 'matching') {
        return 3000;
      }
      return false;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (confirmations: { matchId: string; confirmed: boolean }[]) => {
      const response = await fetch(`/api/children/${activeChildId}/videos/${videoId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ milestoneMatches: confirmations }),
      });
      if (!response.ok) throw new Error('Failed to confirm milestones');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Milestones updated',
        description: `${data.confirmed} milestone(s) confirmed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChildId, 'videos', videoId] });
      queryClient.invalidateQueries({ queryKey: ['/api/children', activeChildId, 'milestones'] });
      setPendingConfirmations({});
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update milestones.',
        variant: 'destructive',
      });
    },
  });

  const handleConfirm = (matchId: string, confirmed: boolean) => {
    setPendingConfirmations((prev) => ({ ...prev, [matchId]: confirmed }));
  };

  const handleSubmitConfirmations = () => {
    const confirmations = Object.entries(pendingConfirmations).map(([matchId, confirmed]) => ({
      matchId,
      confirmed,
    }));
    if (confirmations.length > 0) {
      confirmMutation.mutate(confirmations);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
      case 'analyzing':
      case 'matching':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Uploading...';
      case 'analyzing':
        return 'Analyzing video...';
      case 'matching':
        return 'Matching milestones...';
      case 'completed':
        return 'Analysis complete';
      case 'failed':
        return 'Analysis failed';
      default:
        return status;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.7) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  if (!activeChildId) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 text-center text-muted-foreground">
          Please select a child first.
        </div>
        <BottomNav active="home" onNavigate={handleNavigation} />
      </div>
    );
  }

  if (videoId && analysis) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/video-analysis')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Video Analysis</h1>
              <p className="text-sm text-muted-foreground truncate">{analysis.originalFilename}</p>
            </div>
            {(analysis.status === 'processing' || analysis.status === 'analyzing' || analysis.status === 'matching') && (
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>

        <main className="p-4 space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(analysis.status)}
              <div className="flex-1">
                <p className="font-medium">{getStatusText(analysis.status)}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(analysis.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {(analysis.status === 'processing' || analysis.status === 'analyzing' || analysis.status === 'matching') && (
              <Progress value={analysis.status === 'matching' ? 66 : analysis.status === 'analyzing' ? 33 : 10} className="mt-3 h-2" />
            )}
            {analysis.errorMessage && (
              <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{analysis.errorMessage}</span>
              </div>
            )}
          </Card>

          {analysis.status === 'completed' && (
            <>
              {analysis.matchedMilestones.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Detected Milestones ({analysis.matchedMilestones.length})
                  </h2>
                  {analysis.matchedMilestones.map((match) => (
                    <Card key={match.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium">{match.milestoneTitle}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {match.milestoneCategory}
                            </Badge>
                          </div>
                          <span className={cn("text-sm font-medium", getConfidenceColor(match.confidence))}>
                            {Math.round(match.confidence * 100)}%
                          </span>
                        </div>
                        {match.activityDescription && (
                          <p className="text-sm text-muted-foreground">{match.activityDescription}</p>
                        )}
                        {match.videoTimestamp && (
                          <p className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {match.videoTimestamp}
                          </p>
                        )}
                        {match.autoAchieved && match.parentConfirmed === null && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Auto-achieved
                          </Badge>
                        )}
                        {match.parentConfirmed !== null && (
                          <Badge variant={match.parentConfirmed ? "default" : "secondary"}>
                            {match.parentConfirmed ? 'Confirmed' : 'Rejected'}
                          </Badge>
                        )}
                        {match.parentConfirmed === null && !match.autoAchieved && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={pendingConfirmations[match.id] === true ? "default" : "outline"}
                              onClick={() => handleConfirm(match.id, true)}
                              data-testid={`button-confirm-${match.id}`}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant={pendingConfirmations[match.id] === false ? "destructive" : "outline"}
                              onClick={() => handleConfirm(match.id, false)}
                              data-testid={`button-reject-${match.id}`}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Not yet
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  {Object.keys(pendingConfirmations).length > 0 && (
                    <Button
                      className="w-full"
                      onClick={handleSubmitConfirmations}
                      disabled={confirmMutation.isPending}
                      data-testid="button-submit-confirmations"
                    >
                      {confirmMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Save Confirmations
                    </Button>
                  )}
                </div>
              )}

              {analysis.recommendations.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Recommended Activities</h2>
                    {analysis.recommendations.map((rec, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-0.5",
                              rec.priority === 'high' && "border-red-500 text-red-500",
                              rec.priority === 'medium' && "border-amber-500 text-amber-500",
                              rec.priority === 'low' && "border-blue-500 text-blue-500"
                            )}
                          >
                            {rec.priority}
                          </Badge>
                          <div className="flex-1">
                            <h3 className="font-medium">{rec.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {analysis.detectedActivities.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">All Detected Activities</h2>
                    {analysis.detectedActivities.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <span className="text-muted-foreground w-16 flex-shrink-0">{activity.timestamp}</span>
                        <div className="flex-1">
                          <p>{activity.activity}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{activity.category}</Badge>
                            <span className={cn("text-xs", getConfidenceColor(activity.confidence))}>
                              {Math.round(activity.confidence * 100)}% confident
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {analysis.matchedMilestones.length === 0 && analysis.detectedActivities.length === 0 && (
                <Card className="p-6 text-center">
                  <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium">No activities detected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try uploading a clearer video with more visible activities.
                  </p>
                </Card>
              )}
            </>
          )}
        </main>
        <BottomNav active="home" onNavigate={handleNavigation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Video Analysis</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <VideoUpload
          childId={activeChildId}
          onUploadComplete={(id) => navigate(`/video-analysis/${id}`)}
        />

        {analyses?.analyses && analyses.analyses.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Past Analyses</h2>
            {analyses.analyses.map((a) => (
              <Card
                key={a.id}
                className="p-4 cursor-pointer hover-elevate"
                onClick={() => navigate(`/video-analysis/${a.id}`)}
                data-testid={`card-analysis-${a.id}`}
              >
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.originalFilename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(a.status)}
                      <span className="text-sm text-muted-foreground">{getStatusText(a.status)}</span>
                      {a.status === 'completed' && a.matchedMilestonesCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {a.matchedMilestonesCount} milestone{a.matchedMilestonesCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isLoadingList && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
      <BottomNav active="home" onNavigate={handleNavigation} />
    </div>
  );
}
