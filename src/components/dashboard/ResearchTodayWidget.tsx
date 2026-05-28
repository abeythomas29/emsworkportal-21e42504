import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useResearchTests } from '@/hooks/useResearch';
import { NewTestDialog } from '@/components/research/NewTestDialog';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ResearchTodayWidget() {
  const { data: tests = [], isLoading } = useResearchTests({ todayOnly: true });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Today's Research Tests
        </CardTitle>
        <NewTestDialog
          trigger={
            <Button size="sm">
              <FlaskConical className="w-4 h-4 mr-1" /> Log Test
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tests.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No tests logged for today. Paste your procedure and tag the series to track it.
          </div>
        ) : (
          <div className="space-y-3">
            {tests.slice(0, 4).map((t) => (
              <div key={t.id} className="rounded-md border border-border p-3 bg-muted/20">
                {t.title && <p className="text-sm font-medium mb-1">{t.title}</p>}
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.instructions}</p>
              </div>
            ))}
            <Link to="/research">
              <Button variant="ghost" size="sm" className="w-full">
                View all tests <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
