import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Settings as SettingsIcon, DollarSign, Trophy, Shield, Bell, Database, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { useState, useEffect } from 'react';
import { Loader2, Save, MessageCircle, Share2, FileText, Zap } from 'lucide-react';
import { getPaymentMethods, togglePaymentMethod, getGateways, updateGateway, getSettings, updateSetting } from '../../services/api';
import { toast } from 'sonner';

export function SettingsPage() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [savingGateway, setSavingGateway] = useState<string | null>(null);
  const [savingSetting, setSavingSetting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [methodsRes, gatewaysRes, settingsRes] = await Promise.all([
        getPaymentMethods(),
        getGateways(),
        getSettings()
      ]);
      setPaymentMethods(methodsRes.data || methodsRes);
      setGateways(gatewaysRes.data || gatewaysRes);
      setSettings(settingsRes);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await togglePaymentMethod(id, newStatus);
      setPaymentMethods(methods =>
        methods.map(m => m.id === id ? { ...m, is_enabled: newStatus ? 1 : 0 } : m)
      );
      toast.success('Méthode de paiement mise à jour');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleSaveGateway = async (slug: string) => {
    const gateway = gateways.find(g => g.slug === slug);
    if (!gateway) return;

    try {
      setSavingGateway(slug);
      await updateGateway(slug, gateway);
      toast.success(`${gateway.name} mis à jour avec succès`);
    } catch (error: any) {
      toast.error(error.message || `Erreur lors de la mise à jour de ${gateway.name}`);
    } finally {
      setSavingGateway(null);
    }
  };

  const handleToggleGateway = async (slug: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    // Update local state first for responsiveness
    // If we are activating (newStatus === 1), we deactivate all others locally too
    setGateways(prev => prev.map(g => {
      if (g.slug === slug) return { ...g, is_active: newStatus };
      if (newStatus === 1) return { ...g, is_active: 0 };
      return g;
    }));

    try {
      const gateway = gateways.find(g => g.slug === slug);
      if (!gateway) return;

      // Persist the status change
      await updateGateway(slug, {
        ...gateway,
        is_active: newStatus
      });
      toast.success(`${gateway.name} ${newStatus === 1 ? 'activé' : 'désactivé'}`);

      // Refresh to ensure everything is in sync with backend
      fetchData();
    } catch (error: any) {
      // Revert if error occurs (optional, refetch is safer)
      fetchData();
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleGatewayChange = (slug: string, field: string, value: any) => {
    setGateways(prev => prev.map(g => g.slug === slug ? { ...g, [field]: value } : g));
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = async (key: string) => {
    try {
      setSavingSetting(key);
      await updateSetting(key, settings[key]);
      toast.success(`Paramètre mis à jour`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingSetting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Settings */}
      {/* ... keep existing cards ... */}

      {/* Configuration des Aggrégateurs (PawaPay, etc.) */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Configuration des Aggrégateurs</CardTitle>
              <p className="text-sm text-zinc-400">Paramétrez les clés API pour les paiements réels</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {loading ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement des gateways...</span>
            </div>
          ) : (
            gateways.map((gateway) => (
              <div key={gateway.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{gateway.name}</h3>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${gateway.environment === 'live' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                      {gateway.environment}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Activer le paiement réel</span>
                    <Switch
                      checked={gateway.is_active === 1}
                      onCheckedChange={() => handleToggleGateway(gateway.slug, gateway.is_active)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Merchant ID</Label>
                    <Input
                      value={gateway.merchant_id || ''}
                      onChange={(e) => handleGatewayChange(gateway.slug, 'merchant_id', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Ex: PWP-XXXX-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Environnement</Label>
                    <select
                      value={gateway.environment}
                      onChange={(e) => handleGatewayChange(gateway.slug, 'environment', e.target.value)}
                      className="w-full bg-zinc-800 border-zinc-700 text-white rounded-md h-10 px-3 outline-none"
                    >
                      <option value="sandbox">Sandbox (Test)</option>
                      <option value="live">Live (Production)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">API Key Public</Label>
                    <Input
                      type="password"
                      value={gateway.api_key_public || ''}
                      onChange={(e) => handleGatewayChange(gateway.slug, 'api_key_public', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="pk_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">API Key Secret</Label>
                    <Input
                      type="password"
                      value={gateway.api_key_secret || ''}
                      onChange={(e) => handleGatewayChange(gateway.slug, 'api_key_secret', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="sk_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Webhook Secret</Label>
                    <Input
                      value={gateway.webhook_secret || ''}
                      onChange={(e) => handleGatewayChange(gateway.slug, 'webhook_secret', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Sign-key pour la vérification des notifications"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Webhook URL (Public)</Label>
                    <Input
                      value={gateway.webhook_url || ''}
                      onChange={(e) => handleGatewayChange(gateway.slug, 'webhook_url', e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Ex: https://mean-rabbits-know.loca.lt"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveGateway(gateway.slug)}
                    disabled={savingGateway === gateway.slug}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    {savingGateway === gateway.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer la config {gateway.name}
                  </Button>
                </div>
                <Separator className="bg-zinc-800 opacity-50" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Financial Settings (Original) */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Paramètres financiers</CardTitle>
              <p className="text-sm text-zinc-400">Configuration des taux et limites</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Taux de change USD/CDF</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.exchange_rate_usd_cdf || '2500'}
                  onChange={(e) => handleSettingChange('exchange_rate_usd_cdf', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-zinc-700"
                  onClick={() => handleSaveSetting('exchange_rate_usd_cdf')}
                  disabled={savingSetting === 'exchange_rate_usd_cdf'}
                >
                  {savingSetting === 'exchange_rate_usd_cdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Frais de transaction (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.transaction_fee_percent || '2'}
                  onChange={(e) => handleSettingChange('transaction_fee_percent', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-zinc-700"
                  onClick={() => handleSaveSetting('transaction_fee_percent')}
                  disabled={savingSetting === 'transaction_fee_percent'}
                >
                  {savingSetting === 'transaction_fee_percent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Dépôt minimum (USD)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.min_deposit_usd || '5'}
                  onChange={(e) => handleSettingChange('min_deposit_usd', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-zinc-700"
                  onClick={() => handleSaveSetting('min_deposit_usd')}
                  disabled={savingSetting === 'min_deposit_usd'}
                >
                  {savingSetting === 'min_deposit_usd' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Retrait minimum (USD)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.min_withdrawal_usd || '10'}
                  onChange={(e) => handleSettingChange('min_withdrawal_usd', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-zinc-700"
                  onClick={() => handleSaveSetting('min_withdrawal_usd')}
                  disabled={savingSetting === 'min_withdrawal_usd'}
                >
                  {savingSetting === 'min_withdrawal_usd' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Tournament Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Paramètres des tournois</CardTitle>
              <p className="text-sm text-zinc-400">Configuration par défaut</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Frais d'entrée par défaut (USD)</Label>
              <Input
                type="number"
                defaultValue="1"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Participants max par défaut</Label>
              <Input
                type="number"
                defaultValue="100"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">1ère place (%)</Label>
              <Input
                type="number"
                defaultValue="40"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">2ème place (%)</Label>
              <Input
                type="number"
                defaultValue="25"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Sécurité</CardTitle>
              <p className="text-sm text-zinc-400">Paramètres de sécurité du dashboard</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Authentification à deux facteurs (2FA)</p>
              <p className="text-sm text-zinc-400">Sécurité supplémentaire pour les admins</p>
            </div>
            <Switch />
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Logs d'activité admin</p>
              <p className="text-sm text-zinc-400">Enregistrer toutes les actions admin</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">IP Whitelisting</p>
              <p className="text-sm text-zinc-400">Restreindre l'accès par IP</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Notifications</CardTitle>
              <p className="text-sm text-zinc-400">Configuration des notifications automatiques</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Emails automatiques</p>
              <p className="text-sm text-zinc-400">Envoyer des emails aux joueurs</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">SMS automatiques</p>
              <p className="text-sm text-zinc-400">Envoyer des SMS pour les transactions</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Communication & Social */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Configuration Interne</CardTitle>
              <p className="text-sm text-zinc-400">Services tiers, WhatsApp et Support</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-green-500" />
                <h4 className="font-semibold text-white">Groupe WhatsApp</h4>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Lien d'invitation au groupe</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.whatsapp_group_link || ''}
                    onChange={(e) => handleSettingChange('whatsapp_group_link', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="https://chat.whatsapp.com/..."
                  />
                  <Button
                    variant="outline"
                    className="border-zinc-700"
                    onClick={() => handleSaveSetting('whatsapp_group_link')}
                    disabled={savingSetting === 'whatsapp_group_link'}
                  >
                    {savingSetting === 'whatsapp_group_link' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <h4 className="font-semibold text-white">Support Client (WhatsApp)</h4>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Numéro de téléphone</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.whatsapp_support_number || ''}
                    onChange={(e) => handleSettingChange('whatsapp_support_number', e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Ex: +243..."
                  />
                  <Button
                    variant="outline"
                    className="border-zinc-700"
                    onClick={() => handleSaveSetting('whatsapp_support_number')}
                    disabled={savingSetting === 'whatsapp_support_number'}
                  >
                    {savingSetting === 'whatsapp_support_number' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <h4 className="font-semibold text-white">Whapi.cloud (Automatisations)</h4>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">API Token</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={settings.whapi_api_token || ''}
                  onChange={(e) => handleSettingChange('whapi_api_token', e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Token Whapi..."
                />
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => handleSaveSetting('whapi_api_token')}
                  disabled={savingSetting === 'whapi_api_token'}
                >
                  {savingSetting === 'whapi_api_token' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-zinc-500 italic">Utilisé pour l'envoi d'OTP et de confirmations automatiques par WhatsApp.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beginner Guide Editor */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Guide du Débutant</CardTitle>
              <p className="text-sm text-zinc-400">Modifiez le contenu du guide affiché dans l'application mobile</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Contenu du Guide (Markdown)</Label>
            <textarea
              value={settings.beginner_guide_content || ''}
              onChange={(e) => handleSettingChange('beginner_guide_content', e.target.value)}
              className="w-full min-h-[400px] bg-zinc-800 border-zinc-700 text-white rounded-md p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-600 transition-all"
              placeholder="# Bienvenue sur Blacksnack..."
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => handleSaveSetting('beginner_guide_content')}
              disabled={savingSetting === 'beginner_guide_content'}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              {savingSetting === 'beginner_guide_content' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Mettre à jour le guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Maintenance</CardTitle>
              <p className="text-sm text-zinc-400">Outils de maintenance système</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Mode maintenance</p>
              <p className="text-sm text-zinc-400">Désactiver temporairement l'application</p>
            </div>
            <Switch />
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex gap-3">
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              Sauvegarder la base de données
            </Button>
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              Nettoyer les logs anciens
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}