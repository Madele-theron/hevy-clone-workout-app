import { UserProfile } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    return (
        <div className="flex justify-center p-4 pb-32">
            <UserProfile path="/settings" routing="path" />
        </div>
    );
}
