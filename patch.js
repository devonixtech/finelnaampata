const fs = require('fs');
const path = 'apps/web/app/(dashboard)/dashboard/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const codeToInsert = \    if (isVendor && !isAdmin && setupStatus && !setupStatus.isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-2xl w-full text-center border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BadgeCheck className="w-10 h-10 text-blue-400" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-4">Complete Your Business Profile</h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                        You've started setting up your business, but haven't finished yet. Complete your profile to unlock all vendor features, manage listings, and start receiving leads.
                    </p>
                    
                    <Link
                        href="/business-setup"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                        <Zap className="w-5 h-5 animate-pulse" />
                        Resume Business Setup
                    </Link>
                </div>
            </div>
        );
    }\.split('\\n');

let targetIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return (') && lines[i-1] && lines[i-1].includes('    }')) {
        targetIndex = i;
        break;
    }
}

if (targetIndex !== -1) {
    lines.splice(targetIndex, 0, ...codeToInsert);
    fs.writeFileSync(path, lines.join('\\n'));
    console.log('Successfully inserted code at line ' + (targetIndex + 1));
} else {
    console.log('Could not find target line.');
}
