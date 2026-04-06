import { useParams } from "wouter";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGetUserProfile, useGetUserStats, useListBroadcasts, useToggleFollow, useCheckFollow } from "@workspace/api-client-react";
import { getGetFollowersQueryKey, getGetFollowingQueryKey, getCheckFollowQueryKey, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BroadcastCard } from "@/components/BroadcastCard";
import { Copy, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpsertUserProfile } from "@workspace/api-client-react";

export function Profile() {
  const { wallet } = useParams();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const isOwnProfile = publicKey?.toString() === wallet;

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(wallet || "");
  const { data: stats, isLoading: statsLoading } = useGetUserStats(wallet || "");
  const { data: broadcastsData, isLoading: broadcastsLoading } = useListBroadcasts({ wallet });
  const { data: followStatus } = useCheckFollow(
    { follower_wallet: publicKey?.toString() || "", followed_wallet: wallet || "" },
    { query: { enabled: !!publicKey && !!wallet && !isOwnProfile } }
  );

  const { mutate: toggleFollow, isPending: toggleFollowPending } = useToggleFollow();
  const { mutate: updateProfile, isPending: updateProfilePending } = useUpsertUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(profile?.username || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");

  const handleCopyWallet = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet);
      toast.success("Wallet address copied");
    }
  };

  const handleFollowToggle = () => {
    if (!publicKey || !wallet) return;
    toggleFollow(
      { data: { follower_wallet: publicKey.toString(), followed_wallet: wallet } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getCheckFollowQueryKey({ follower_wallet: publicKey.toString(), followed_wallet: wallet }) });
          queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey(wallet) });
        }
      }
    );
  };

  const handleSaveProfile = () => {
    updateProfile(
      { data: { username: editUsername, bio: editBio } },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          setIsEditing(false);
          // Refresh profile
          queryClient.invalidateQueries({ queryKey: [`/api/users/${wallet}`] });
        }
      }
    );
  };

  if (!wallet) return <div>Invalid wallet address</div>;

  return (
    <div className="container max-w-screen-md px-4 md:px-8 py-8 space-y-8">
      <Card className="bg-card border-border overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent absolute top-0 left-0 right-0" />
        <CardContent className="pt-16 pb-6 px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              {isEditing ? (
                <div className="space-y-4 w-full max-w-sm mb-4">
                  <Input 
                    placeholder="Username" 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                  />
                  <Textarea 
                    placeholder="Bio" 
                    value={editBio} 
                    onChange={(e) => setEditBio(e.target.value)} 
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={updateProfilePending}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold font-mono tracking-tighter mb-2">
                    {profile?.username || "Anonymous Degen"}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyWallet}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {profile?.bio && <p className="text-sm text-foreground/80 max-w-lg mb-4">{profile.bio}</p>}
                </>
              )}

              <div className="flex items-center gap-6 mt-4">
                <div className="flex flex-col">
                  <span className="text-xl font-bold font-mono">{stats?.total_volume_sol.toFixed(2) || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Vol (SOL)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold font-mono">{stats?.broadcast_count || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Broadcasts</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold font-mono">{stats?.followers_count || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold font-mono">{stats?.following_count || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Following</span>
                </div>
              </div>
            </div>

            <div>
              {isOwnProfile ? (
                !isEditing && <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              ) : (
                <Button 
                  onClick={handleFollowToggle} 
                  disabled={!publicKey || toggleFollowPending}
                  variant={followStatus?.following ? "secondary" : "default"}
                  className="font-bold uppercase tracking-wider"
                >
                  {toggleFollowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                   followStatus?.following ? <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</> : 
                   <><UserPlus className="h-4 w-4 mr-2" /> Follow</>}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-mono uppercase tracking-tighter">Broadcast History</h2>
        {broadcastsLoading ? (
          <div className="text-center py-10">Loading history...</div>
        ) : broadcastsData?.broadcasts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
            No broadcasts yet.
          </div>
        ) : (
          broadcastsData?.broadcasts.map((broadcast) => (
            <BroadcastCard key={broadcast.id} broadcast={broadcast} />
          ))
        )}
      </div>
    </div>
  );
}
