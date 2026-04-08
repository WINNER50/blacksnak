import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { mockLogs } from '../data/mockData';
import { Filter, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useState } from 'react';
import { format } from 'date-fns';

export function LogsPage() {
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredLogs = typeFilter === 'all'
    ? mockLogs
    : mockLogs.filter(log => log.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{mockLogs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-500">
              {mockLogs.filter(l => l.type === 'admin').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Système</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {mockLogs.filter(l => l.type === 'system').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Erreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {mockLogs.filter(l => l.type === 'error').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            Logs d'activité ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">Date/Heure</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Admin</TableHead>
                <TableHead className="text-zinc-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        log.type === 'admin' ? 'text-purple-500' :
                        log.type === 'system' ? 'text-blue-500' :
                        log.type === 'user' ? 'text-green-500' :
                        'text-red-500'
                      }
                    >
                      {log.type === 'admin' ? 'Admin' :
                       log.type === 'system' ? 'Système' :
                       log.type === 'user' ? 'Utilisateur' : 'Erreur'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{log.admin}</TableCell>
                  <TableCell className="text-white">{log.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}