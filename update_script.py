import sys
import re

file_path = r'c:\Users\Ahmed Bilal Khan\Desktop\business-directory\apps\web\app\business\[businessSlug]\BusinessDetailClient.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The UI we want to replace starts after `const prevImage = (e?: React.MouseEvent) => { ... }`
# Around line 982: `return (\n    <div className="min-h-screen bg-white">`
# Let's replace the whole `return ( ... )` with our new implementation.
# Wait, that's almost the end of the file, but we should make sure we preserve the end brace `}` of the component.

match = re.search(r'(\s*return\s*\(\s*<div className="min-h-screen bg-white">.*)', content, re.DOTALL)
if not match:
    print("Could not find the return block")
    sys.exit(1)

head = content[:match.start()]

# We'll construct the new return block.
new_jsx = """
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {business.status === "pending" && (
        <div className="bg-amber-50 border-y border-amber-100 py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 text-amber-700">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-sm font-black uppercase tracking-wider">
              Pending Approval
            </span>
            <span className="text-sm opacity-80 hidden sm:inline">
              | This listing is currently being reviewed by our team.
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600 shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <Link href={`/search?category=${business.category?.slug || ""}`} className="hover:text-blue-600 truncate max-w-[100px] md:max-w-none">
          {business.category?.name || "Category"}
        </Link>
        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
        <span className="text-slate-900 font-medium truncate">{business.title}</span>
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-24 lg:pb-12">
        {/* TOP HEADER: 3-Column Photo Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2 mb-6 h-[400px]">
          {/* Main Large Image (Left) */}
          <div
            className="relative rounded-l-2xl overflow-hidden bg-slate-100 cursor-pointer group h-full"
            onClick={() => galleryImages.length > 0 && openLightbox(0)}
          >
            {galleryImages.length > 0 ? (
              <>
                <img
                  src={galleryImages[0]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={business.title}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <Images className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">No photos</span>
              </div>
            )}
          </div>

          {/* Right Column (Map Top, Grid Bottom) */}
          <div className="grid grid-rows-2 gap-2 h-full">
            {/* Map (Top Right) */}
            <div className="relative rounded-tr-2xl overflow-hidden bg-slate-100 cursor-pointer group">
              {mapEmbedUrl ? (
                showMapEmbed ? (
                  <iframe
                    title="Business location map"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="w-full h-full relative" onClick={() => setShowMapEmbed(true)}>
                    <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors bg-white/50 backdrop-blur-sm">
                      <MapPin className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold">See Map</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <MapPin className="w-8 h-8 mb-2" />
                  <span className="text-xs">No Location</span>
                </div>
              )}
            </div>

            {/* Smaller Photos Grid (Bottom Right) */}
            <div className="grid grid-cols-2 gap-2 h-full relative">
              <div
                className="relative overflow-hidden bg-slate-100 cursor-pointer group"
                onClick={() => openLightbox(1)}
              >
                {galleryImages.length > 1 ? (
                  <img src={galleryImages[1]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gallery 2" />
                ) : (
                  <div className="w-full h-full bg-slate-50" />
                )}
              </div>
              <div
                className="relative rounded-br-2xl overflow-hidden bg-slate-100 cursor-pointer group"
                onClick={() => openLightbox(2)}
              >
                {galleryImages.length > 2 ? (
                  <img src={galleryImages[2]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Gallery 3" />
                ) : (
                  <div className="w-full h-full bg-slate-50" />
                )}
                {galleryImages.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors">
                    <div className="flex items-center gap-2 text-white font-medium text-sm">
                      <Images className="w-4 h-4" />
                      See all {galleryImages.length} photos
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TITLE BLOCK */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {business.title}
            </h1>
            {business.isVerified && (
              <ShieldCheck className="w-6 h-6 text-blue-500 fill-blue-50" />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-900">{business.averageRating || 'New'}</span>
              <div className="flex text-amber-400">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= (business.averageRating || 0) ? 'fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <a href="#reviews" className="text-blue-600 hover:underline">({business.totalReviews || 0} reviews)</a>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-slate-700">{business.category?.name || 'Business'}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-700">{business.address}, {business.city}</span>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium mb-6">
            <BusinessOpenBadge business={business} />
          </div>

          {/* ACTION BUTTONS (Pills) */}
          <div className="flex flex-wrap gap-3">
            {business.website && (
              <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600">
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 border border-blue-600 rounded-full hover:bg-blue-700 transition-colors text-sm font-bold text-white">
              <Navigation className="w-4 h-4" /> Directions
            </button>
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-blue-600">
                <Phone className="w-4 h-4" /> Call
              </a>
            )}
            <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full transition-colors text-sm font-bold ${isFavorite ? 'border-blue-200 text-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-blue-500 text-blue-500' : ''}`} /> Save
            </button>
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto">
          {['Overview', 'Services', 'Reviews', 'Photos', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-4 text-sm font-bold whitespace-nowrap border-b-4 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-[400px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
              <div className="space-y-8">
                {/* About snippet */}
                {business.description && (
                  <div>
                    <p className={`text-sm text-slate-700 leading-relaxed ${!aboutExpanded ? 'line-clamp-4' : ''}`}>
                      {business.description}
                    </p>
                    {business.description.length > 200 && (
                      <button onClick={() => setAboutExpanded(!aboutExpanded)} className="text-sm font-bold text-blue-600 hover:underline mt-2">
                        {aboutExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Highlights */}
                {business.businessAmenities && business.businessAmenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Highlights</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                      {business.businessAmenities.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          <span className="text-sm text-slate-700 font-medium">{item.amenity?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Times */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Popular times</h3>
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <PopularTimesChart businessHours={business.businessHours} />
                  </div>
                </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-6">
                {/* Business Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Business info</h3>
                  <div className="space-y-4">
                    {business.address && (
                      <div className="flex gap-4">
                        <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{business.address}</div>
                          {business.city && <div className="text-sm text-slate-500">{business.city}</div>}
                        </div>
                      </div>
                    )}
                    {business.businessHours && business.businessHours.length > 0 && (
                      <div className="flex gap-4">
                        <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 mb-2">Hours</div>
                          <div className="space-y-1.5">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                              const hour = business.businessHours?.find((h: any) => h.dayOfWeek.toLowerCase() === day);
                              const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                              return (
                                <div key={day} className={`flex items-center justify-between text-sm ${isToday ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                  <span className="capitalize">{day[:3]}</span>
                                  <span>{hour ? (hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed') : 'Closed'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-4">
                        <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                        <a href={`tel:${business.phone}`} className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline">{business.phone}</a>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-4">
                        <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                        <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">
                          {business.website.replace(/^https?:\\/\\//, '')}
                        </a>
                      </div>
                    )}
                    {business.priceRange && (
                      <div className="flex items-center gap-4">
                        <Tag className="w-5 h-5 text-blue-600 shrink-0" />
                        <span className="text-sm font-medium text-slate-900">{business.priceRange}</span>
                      </div>
                    )}
                  </div>
                </div>

                {vendorHasChat && !isOwner && (
                  <ChatTrigger
                    ref={chatRef}
                    businessId={business.id}
                    businessName={business.title}
                    vendorHasChat={vendorHasChat}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  />
                )}
                {!isOwner && (
                  <button onClick={openEnquiryModal} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                    <Send className="w-4 h-4" /> Send Enquiry
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Services offered</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {business.category && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-500 transition-colors cursor-pointer group">
                    <Store className="w-6 h-6 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-slate-900">{business.category.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Primary category</p>
                  </div>
                )}
                {business.subcategories && business.subcategories.map((sub: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500 transition-colors cursor-pointer">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="font-medium text-slate-900">{sub.name || sub}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Review Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <ReviewDistribution reviews={comments} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900">Reviews</h3>
                <div className="flex items-center gap-3">
                  {!isOwner && (
                    <button
                      onClick={() => {
                        if (!user) {
                          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                          return;
                        }
                        setShowReviewModal(true);
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                    >
                      Write a review
                    </button>
                  )}
                </div>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment: any, idx: number) => (
                    <div key={comment.id || `comment-${idx}`} className="pb-6 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200">
                            {comment.user?.avatarUrl ? (
                              <img
                                src={getImageUrl(comment.user.avatarUrl) as string}
                                alt={comment.user.fullName || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png'; }}
                              />
                            ) : (
                              (comment.user?.fullName?.[0] || 'U').toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900">{comment.user?.fullName || 'Anonymous'}</h4>
                              <TrustBadge badge={comment.user?.badge} score={comment.user?.trust_score} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < (comment.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {comment.comment && (
                        <p className="text-slate-700 leading-relaxed text-sm">{comment.comment}</p>
                      )}

                      {comment.images && comment.images.length > 0 && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {comment.images.map((img: string, imgIdx: number) => (
                            <a key={imgIdx} href={img} target="_blank" rel="noopener noreferrer">
                              <img src={img} alt={`Review photo ${imgIdx + 1}`} className="w-24 h-24 rounded-xl object-cover border border-slate-200 hover:border-blue-400 transition-colors" />
                            </a>
                          ))}
                        </div>
                      )}
                      
                      {user && !isOwner && user.id !== comment.userId && (
                        <div className="mt-4 flex items-center gap-4">
                          <button onClick={() => handleHelpful(comment.id)} disabled={helpfulLoading === comment.id} className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${comment.userHelpful ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                            {helpfulLoading === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className={`w-4 h-4 ${comment.userHelpful ? 'fill-blue-600 text-blue-600' : ''}`} />}
                            Helpful {comment.helpfulCount > 0 && `(${comment.helpfulCount})`}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">No reviews yet</h4>
                  <p className="text-sm text-slate-500">Be the first to review {business.title}.</p>
                </div>
              )}
            </div>
          )}

          {/* PHOTOS TAB */}
          {activeTab === 'photos' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-900">Photos</h3>
                {!isOwner && user && (
                  <button onClick={() => setShowAddPhotoModal(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Images className="w-4 h-4" /> Add a photo
                  </button>
                )}
              </div>

              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
                      onClick={() => openLightbox(idx)}
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Images className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm font-medium">No photos yet</p>
                </div>
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="animate-in fade-in duration-500 space-y-8 max-w-3xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">From the business</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {business.description || "No description provided."}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                   {(business.logoUrl || business.vendor?.user?.avatarUrl) ? (
                     <img
                       src={getImageUrl(business.logoUrl || business.vendor?.user?.avatarUrl) as string}
                       alt={business.title}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <span className="text-2xl font-bold text-slate-300">
                       {(business.title?.[0] || 'B').toUpperCase()}
                     </span>
                   )}
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-lg mb-1">{business.vendor?.user?.fullName || 'Business Owner'}</h4>
                   <p className="text-sm text-slate-500">Business owner</p>
                   {business.vendor?.user?.createdAt && (
                     <p className="text-xs text-slate-400 mt-1">Joined {new Date(business.vendor.user.createdAt).getFullYear()}</p>
                   )}
                 </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Lightbox / Modals / Footer */}
      {/* Keeping original Modals and Footer below by just adding them directly as they were mostly independent */}
      <Footer />
"""

footer_and_modals = content[content.find('      {showReviewModal && ('):]
new_jsx += footer_and_modals

final_content = head + new_jsx

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Replacement successful")
