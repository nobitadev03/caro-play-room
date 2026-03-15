import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export function AuthDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { theme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng nhập tài khoản</DialogTitle>
          <DialogDescription>
            Đăng nhập để vào hệ thống tính điểm Rank ELO và bảng xếp hạng
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme={theme === 'dark' ? 'dark' : 'default'}
            providers={['google', 'github']}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email",
                  password_label: "Mật khẩu",
                  button_label: "Đăng nhập",
                  loading_button_label: "Đang đăng nhập ...",
                  social_provider_text: "Đăng nhập với {{provider}}",
                  link_text: "Đã có tài khoản? Đăng nhập"
                },
                sign_up: {
                  email_label: "Email",
                  password_label: "Mật khẩu",
                  button_label: "Đăng ký",
                  loading_button_label: "Đang đăng ký ...",
                  social_provider_text: "Đăng ký với {{provider}}",
                  link_text: "Chưa có tài khoản? Đăng ký ngay"
                }
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserProfileButton() {
  const { user, profile, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // Auto hide auth modal when logged in
  useEffect(() => {
    if (user && showAuth) setShowAuth(false);
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
          Đăng nhập
        </Button>
        <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end text-right">
        <span className="text-sm font-semibold">{profile?.display_name || user.email?.split('@')[0]}</span>
        <span className="text-xs text-muted-foreground font-mono">ELO: {profile?.elo_rating || 1200}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={signOut} title="Đăng xuất">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
