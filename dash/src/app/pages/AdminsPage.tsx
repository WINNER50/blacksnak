import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { mockAdmins } from '../data/mockData';
import { Plus, Edit, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { format } from 'date-fns';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive';
  lastLogin: string;
}

export function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'super_admin' | 'admin' | 'moderator'>('admin');

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('admin');
  };

  const handleAddAdmin = () => {
    const newAdmin: Admin = {
      id: Math.max(...admins.map(a => a.id)) + 1,
      name: formName,
      email: formEmail,
      role: formRole,
      status: 'active',
      lastLogin: new Date().toISOString(),
    };
    setAdmins([...admins, newAdmin]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditAdmin = () => {
    if (!selectedAdmin) return;
    setAdmins(admins.map(a => 
      a.id === selectedAdmin.id 
        ? { ...a, name: formName, email: formEmail, role: formRole }
        : a
    ));
    setIsEditDialogOpen(false);
    setSelectedAdmin(null);
    resetForm();
  };

  const handleDeleteAdmin = () => {
    if (!selectedAdmin) return;
    setAdmins(admins.filter(a => a.id !== selectedAdmin.id));
    setIsDeleteDialogOpen(false);
    setSelectedAdmin(null);
  };

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormRole(admin.role);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des administrateurs</h2>
          <p className="text-zinc-400 mt-1">Gérer les accès et permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl">Nouvel Administrateur</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Créer un nouveau compte administrateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white">Nom complet</Label>
                <Input
                  placeholder="Jean Dupont"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  placeholder="jean.dupont@blacksnack.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="mt-2 bg-zinc-800 border-zinc-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-white">Rôle</Label>
                <Select value={formRole} onValueChange={(val: 'super_admin' | 'admin' | 'moderator') => setFormRole(val)}>
                  <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddDialogOpen(false)}
                variant="outline"
                className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddAdmin}
                disabled={!formName || !formEmail || !formPassword}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Créer l'admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-500">
              {admins.filter(a => a.role === 'super_admin').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {admins.filter(a => a.role === 'admin').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Modérateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {admins.filter(a => a.role === 'moderator').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Permissions par rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg">
              <Shield className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <p className="font-medium text-white">Super Admin</p>
                <p className="text-sm text-zinc-400">Accès complet à toutes les fonctionnalités</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg">
              <Shield className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="font-medium text-white">Admin</p>
                <p className="text-sm text-zinc-400">Toutes les fonctionnalités sauf gestion des admins</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg">
              <Shield className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <p className="font-medium text-white">Modérateur</p>
                <p className="text-sm text-zinc-400">Vue seule + Recharge de comptes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Liste des administrateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">Nom</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Rôle</TableHead>
                <TableHead className="text-zinc-400">Dernière connexion</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white font-medium">{admin.name}</TableCell>
                  <TableCell className="text-zinc-400">{admin.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        admin.role === 'super_admin' ? 'text-purple-500' :
                        admin.role === 'admin' ? 'text-blue-500' : 'text-green-500'
                      }
                    >
                      {admin.role === 'super_admin' ? 'Super Admin' :
                       admin.role === 'admin' ? 'Admin' : 'Modérateur'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {format(new Date(admin.lastLogin), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-500">
                      {admin.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) resetForm();
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => openEditDialog(admin)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">Modifier l'administrateur</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                              Modifier les informations de l'administrateur
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label className="text-white">Nom complet</Label>
                              <Input
                                placeholder="Jean Dupont"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-white">Email</Label>
                              <Input
                                type="email"
                                placeholder="jean.dupont@blacksnack.com"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-white">Rôle</Label>
                              <Select value={formRole} onValueChange={(val: 'super_admin' | 'admin' | 'moderator') => setFormRole(val)}>
                                <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="moderator">Modérateur</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setIsEditDialogOpen(false)}
                              variant="outline"
                              className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                            >
                              Annuler
                            </Button>
                            <Button
                              onClick={handleEditAdmin}
                              disabled={!formName || !formEmail}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Enregistrer les modifications
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setSelectedAdmin(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => openDeleteDialog(admin)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl">Supprimer l'administrateur</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              Êtes-vous sûr de vouloir supprimer cet administrateur ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                            >
                              Annuler
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAdmin}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}