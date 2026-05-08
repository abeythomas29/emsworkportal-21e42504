import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, AlertCircle, Loader2 } from 'lucide-react';
import { useUpcomingFollowUps, LEAD_STATUS_LABELS } from '@/hooks/useLeads';

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function FollowUpsWidget() {
  const { data: leads = [], isLoading } = useUpcomingFollowUps();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Sales Follow-ups
        </CardTitle>
        <Link to="/leads">
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups in the next 7 days.</p>
        ) : (
          <div className="space-y-2">
            {leads.slice(0, 6).map((l) => {
              const overdue = l.next_follow_up && new Date(l.next_follow_up) < today;
              return (
                <Link
                  key={l.id}
                  to="/leads"
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{l.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {LEAD_STATUS_LABELS[l.status]}
                      {l.contact_person ? ` · ${l.contact_person}` : ''}
                    </p>
                  </div>
                  <div className={`text-xs flex items-center gap-1 flex-shrink-0 ml-3 ${overdue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                    {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                    {fmt(l.next_follow_up!)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
