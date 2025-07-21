import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function MemberDashboardPage() {
  // Mock data - replace with actual data from your API
  const stats = [
    { title: 'Total Grants', value: '24', icon: FileText, description: 'Assigned to you' },
    { title: 'In Progress', value: '8', icon: Clock, description: 'Active grants' },
    { title: 'Completed', value: '14', valueChange: '+2', icon: CheckCircle, description: 'This month' },
    { title: 'Pending Approval', value: '2', icon: AlertCircle, description: 'Waiting for review' },
  ];

  const recentGrants = [
    { id: 1, name: 'Education Fund 2023', status: 'In Progress', deadline: '2023-12-15', progress: 65 },
    { id: 2, name: 'Healthcare Initiative', status: 'Pending', deadline: '2023-11-30', progress: 0 },
    { id: 3, name: 'Community Outreach', status: 'In Progress', deadline: '2023-12-01', progress: 30 },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Submit Q4 Report', due: '2023-11-25', priority: 'High' },
    { id: 2, title: 'Review Budget', due: '2023-11-28', priority: 'Medium' },
    { id: 3, title: 'Team Meeting', due: '2023-11-30', priority: 'Low' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Member Dashboard</h1>
        <Button>New Report</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Grants */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Grants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrants.map((grant) => (
                <div key={grant.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{grant.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      grant.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      grant.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {grant.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Due: {new Date(grant.deadline).toLocaleDateString()}</span>
                      <span>{grant.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          grant.status === 'In Progress' ? 'bg-blue-500' :
                          grant.status === 'Pending' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${grant.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3">
                  <div className={`h-2 w-2 mt-2 rounded-full ${
                    task.priority === 'High' ? 'bg-red-500' :
                    task.priority === 'Medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                      <span className={`${
                        task.priority === 'High' ? 'text-red-500' :
                        task.priority === 'Medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
