import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password) {
      setError("Tutti i campi sono obbligatori");
      return;
    }

    if (formData.password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Inserisci un indirizzo email valido");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      const data = await response.json();

      toast({
        title: "Registrazione completata!",
        description: `Benvenuto ${formData.firstName}! La tua organizzazione è stata creata automaticamente.`,
      });

      // Redirect to dashboard
      setLocation("/");

    } catch (error: any) {
      const errorMessage = error.message || "Errore durante la registrazione";
      setError(errorMessage);
      toast({
        title: "Errore registrazione",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" data-testid="signup-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Crea Account</CardTitle>
          <p className="text-muted-foreground">
            Registrati per accedere a Stratikey
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Mario"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  data-testid="firstname-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Rossi"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  data-testid="lastname-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mario.rossi@esempio.it"
                value={formData.email}
                onChange={handleInputChange}
                required
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Almeno 8 caratteri"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  data-testid="password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ripeti la password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                data-testid="confirm-password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="signup-button"
            >
              {isLoading ? "Creazione account..." : "Crea Account"}
            </Button>
          </form>

          <div className="mt-6">
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Oppure continua con
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/api/login"}
                data-testid="oauth-login-button"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Replit Account
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Hai già un account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setLocation("/sign-in")}
                data-testid="signin-link"
              >
                Accedi
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}