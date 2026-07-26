const fs = require('fs');
const file = 'apps/web/app/(dashboard)/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const target1 = `                const [favoritesData, followsData] = await Promise.all([
                    api.users.getFavorites({ silent: true }).catch(() => ({ data: [] })),
                    api.follows.myFollows({ silent: true }).catch(() => ({ data: [] }))
                ]);`;
                
const replace1 = `                const [favoritesData, followsData, reviewsData, notifsData] = await Promise.all([
                    api.users.getFavorites({ silent: true }).catch(() => ({ data: [] })),
                    api.follows.myFollows(1, 20, { silent: true }).catch(() => ({ data: [] })),
                    api.reviews.myReviews({ silent: true }).catch(() => ({ data: [] })),
                    api.notifications.getAll({ silent: true }).catch(() => ({ data: [] }))
                ]);`;

const target2 = `                if (isVendor || isAdmin) {
                    const [statsData, businessProfile, affiliateData] = await Promise.all([
                        api.businessProfiles.getStats({ silent: true }).catch(() => null),
                        api.businessProfiles.getProfile({ silent: true }).catch(() => null),
                        api.affiliate.getStats({ silent: true }).catch(() => null)
                    ]);
                    setStats(statsData);
                    setVendorProfile(businessProfile);
                    setAffiliateStats(affiliateData);
                    setStats({
                        savedCount: favoritesData.data?.length || 0,
                        reviewsCount: reviewsData.data?.length || 0,
                        unreadNotifs: notifsData.data?.filter((n: any) => !n.isRead).length || 0
                    });
                }`;

const replace2 = `                if (isVendor || isAdmin) {
                    const [statsData, businessProfile, affiliateData] = await Promise.all([
                        api.businessProfiles.getStats({ silent: true }).catch(() => null),
                        api.businessProfiles.getProfile({ silent: true }).catch(() => null),
                        api.affiliate.getStats({ silent: true }).catch(() => null)
                    ]);
                    setStats({
                        ...(statsData || {}),
                        savedCount: favoritesData.data?.length || 0,
                        reviewsCount: reviewsData.data?.length || 0,
                        unreadNotifs: notifsData.data?.filter((n: any) => !n.isRead).length || 0
                    });
                    setVendorProfile(businessProfile);
                    setAffiliateStats(affiliateData);
                } else if (user) {
                    setStats({
                        savedCount: favoritesData.data?.length || 0,
                        reviewsCount: reviewsData.data?.length || 0,
                        unreadNotifs: notifsData.data?.filter((n: any) => !n.isRead).length || 0
                    });
                }`;

if (content.includes(target1) && content.includes(target2)) {
    content = content.replace(target1, replace1);
    content = content.replace(target2, replace2);
    fs.writeFileSync(file, content);
    console.log('Fixed exactly!');
} else {
    console.log('Targets not found', { t1: content.includes(target1), t2: content.includes(target2) });
}
