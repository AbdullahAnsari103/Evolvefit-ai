import React, { useState, useRef, useEffect } from 'react';
import { Post } from '../types';
import { getPosts, savePost, updatePost, deletePost } from '../services/storageService';

export const Community: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All Posts');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  
  // Real-time Simulation State
  const [incomingPosts, setIncomingPosts] = useState<Post[]>([]);
  const [showNewPostsPill, setShowNewPostsPill] = useState(false);

  // New Post State
  const [newCaption, setNewCaption] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentInput, setCommentInput] = useState('');

  // Editing State
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');

  const [posts, setPosts] = useState<Post[]>([]);

  // Load from Storage
  useEffect(() => {
      setPosts(getPosts());
  }, []);

  // --- Real-time Simulation ---
  useEffect(() => {
    // Only simulate if we have fewer than 10 posts to avoid spamming storage
    if (posts.length > 10) return;

    // Simulate a new post arriving after 8 seconds
    const timer = setTimeout(() => {
        const simulatedPost: Post = {
            id: Date.now() + 999, // Ensure unique ID
            user: "Rahul_Gains",
            badge: "Streak",
            badgeType: "blue",
            time: "Just now",
            likes: 0,
            isLiked: false,
            commentsCount: 0,
            textOnly: true,
            caption: "Just completed my first 5k run! The dashboard tracking is super accurate. 🏃‍♂️💨",
            tags: ["#Running", "#Milestone"],
            category: 'Milestone',
            isFollowing: false,
            comments: []
        };
        setIncomingPosts([simulatedPost]);
        setShowNewPostsPill(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [posts.length]);

  const handleLoadNewPosts = () => {
      // Save to storage first
      incomingPosts.forEach(p => savePost(p));
      // Update local state by reloading from storage to ensure sync
      setPosts(getPosts());
      setIncomingPosts([]);
      setShowNewPostsPill(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Actions ---

  const handleLike = (postId: number) => {
      const post = posts.find(p => p.id === postId);
      if (post) {
          const updatedPost = {
              ...post,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked
          };
          updatePost(updatedPost);
          setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      }
  };

  const handleToggleComments = (postId: number) => {
      setExpandedComments(expandedComments === postId ? null : postId);
  };

  const handleAddComment = (postId: number) => {
      if (!commentInput.trim()) return;
      const post = posts.find(p => p.id === postId);
      if (post) {
          const updatedPost = {
              ...post,
              comments: [...post.comments, {
                  id: Date.now(),
                  user: "You",
                  text: commentInput,
                  time: "Just now"
              }],
              commentsCount: post.commentsCount + 1
          };
          updatePost(updatedPost);
          setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
          setCommentInput('');
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  const MAX_WIDTH = 800; // Resize to avoid storage quota issues
                  
                  if (width > MAX_WIDTH) {
                      height *= MAX_WIDTH / width;
                      width = MAX_WIDTH;
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  setNewImage(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmitPost = () => {
      if (!newCaption && !newImage) return;

      const newPost: Post = {
          id: Date.now(),
          user: "You",
          time: "Just now",
          likes: 0,
          isLiked: false,
          commentsCount: 0,
          image: newImage || undefined,
          textOnly: !newImage,
          caption: newCaption,
          tags: [],
          category: 'General', // Default
          isFollowing: true,
          comments: []
      };

      savePost(newPost);
      setPosts(getPosts()); // Reload from storage
      setNewCaption('');
      setNewImage(null);
      setShowPostModal(false);
  };

  // --- Edit & Delete Actions for "You" ---
  const handleDeleteMyPost = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if(window.confirm("Are you sure you want to delete this post?")) {
          // Use the updated list returned from deletePost to ensure sync
          const updatedPosts = deletePost(id);
          setPosts(updatedPosts);
      }
  };

  const handleStartEdit = (post: Post) => {
      setEditingPostId(post.id);
      setEditCaption(post.caption);
  };

  const handleCancelEdit = () => {
      setEditingPostId(null);
      setEditCaption('');
  };

  const handleSaveEdit = (id: number) => {
      const post = posts.find(p => p.id === id);
      if (post) {
          const updatedPost = { ...post, caption: editCaption };
          updatePost(updatedPost);
          setPosts(prev => prev.map(p => p.id === id ? updatedPost : p));
          setEditingPostId(null);
          setEditCaption('');
      }
  };

  // --- Filter Logic ---
  const filteredPosts = posts.filter(post => {
      if (activeFilter === 'All Posts') return true;
      if (activeFilter === 'Milestones') return post.category === 'Milestone';
      if (activeFilter === 'Nutrition') return post.category === 'Nutrition';
      if (activeFilter === 'Following') return post.isFollowing;
      return true;
  });

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 relative min-h-screen pb-20">
        
        {/* Header & Filters */}
        <div className="flex justify-between items-center px-2 sticky top-0 bg-black/80 backdrop-blur-md z-30 py-3 -mx-2">
            <div>
                <h1 className="text-xl font-bold text-white">Community Room</h1>
            </div>
            <div 
                onClick={() => setShowRules(true)}
                className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-700 flex items-center justify-center cursor-pointer transition-colors border border-white/10"
                title="Community Rules"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All Posts', 'Milestones', 'Nutrition', 'Following'].map(filter => (
                <button 
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                        activeFilter === filter 
                        ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/20 scale-105' 
                        : 'bg-dark-800 text-slate-400 border border-white/10 hover:bg-dark-700 hover:text-white'
                    }`}
                >
                    {filter}
                </button>
            ))}
        </div>

        {/* New Posts Pill */}
        {showNewPostsPill && (
            <div className="sticky top-20 z-20 flex justify-center pointer-events-none">
                <button 
                    onClick={handleLoadNewPosts}
                    className="pointer-events-auto bg-brand-500 text-black px-4 py-2 rounded-full font-bold text-xs shadow-xl shadow-brand-500/30 animate-bounce flex items-center gap-2"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    New Posts Available
                </button>
            </div>
        )}

        {/* Feed */}
        <div className="space-y-6">
            {filteredPosts.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <span className="text-2xl grayscale opacity-50">📭</span>
                    </div>
                    <p>No posts found in this category.</p>
                </div>
            )}
            
            {filteredPosts.map(post => (
                <div key={post.id} className="bg-dark-900 md:bg-dark-800 md:border border-white/5 rounded-none md:rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/10">
                    
                    {/* Post Header */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden border border-white/10">
                                <img src={`https://ui-avatars.com/api/?name=${post.user}&background=random&color=fff`} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-white">{post.user}</h3>
                                    {post.badge && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase
                                            ${post.badgeType === 'gold' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                              post.badgeType === 'green' ? 'bg-brand-500/10 text-brand-500 border-brand-500/20' :
                                              'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {post.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">{post.time}</p>
                            </div>
                        </div>
                        
                        {/* Options for Own Post */}
                        {post.user === 'You' ? (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleStartEdit(post)}
                                    className="text-slate-500 hover:text-brand-500 p-1"
                                    title="Edit"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteMyPost(e, post.id)}
                                    className="text-slate-500 hover:text-red-500 p-1"
                                    title="Delete"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ) : (
                            <button className="text-slate-500 hover:text-white">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                            </button>
                        )}
                    </div>

                    {/* Post Content */}
                    {editingPostId === post.id ? (
                        // Edit Mode
                        <div className="px-4 py-4 bg-dark-800 border-t border-b border-white/5">
                            <textarea 
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                className="w-full bg-black/30 text-white rounded-lg p-3 text-sm focus:border-brand-500 outline-none resize-none mb-2"
                                rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                                <button onClick={handleCancelEdit} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded bg-white/5">Cancel</button>
                                <button onClick={() => handleSaveEdit(post.id)} className="text-xs font-bold text-black bg-brand-500 hover:bg-brand-400 px-3 py-1.5 rounded">Save Changes</button>
                            </div>
                        </div>
                    ) : (
                        // View Mode
                        post.textOnly ? (
                            <div className="px-8 py-10 bg-gradient-to-br from-dark-800 to-dark-900 flex items-center justify-center text-center">
                                <p className="text-xl md:text-2xl font-serif italic text-slate-200 leading-relaxed">"{post.caption}"</p>
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                <img src={post.image} className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
                            </div>
                        )
                    )}

                    {/* Actions */}
                    <div className="p-4 pb-2">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-6">
                                {/* Like Button */}
                                <button 
                                    onClick={() => handleLike(post.id)}
                                    className="flex items-center gap-2 group"
                                >
                                    <div className={`transition-transform duration-200 ${post.isLiked ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill={post.isLiked ? "#ef4444" : "none"} stroke={post.isLiked ? "#ef4444" : "currentColor"} strokeWidth="2" className={post.isLiked ? 'text-red-500' : 'text-white'}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    </div>
                                    <span className={`text-sm font-bold ${post.isLiked ? 'text-white' : 'text-slate-400'}`}>{post.likes}</span>
                                </button>
                                
                                {/* Comment Button */}
                                <button 
                                    onClick={() => handleToggleComments(post.id)}
                                    className="flex items-center gap-2 group"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white group-hover:text-brand-500 transition-colors"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{post.commentsCount}</span>
                                </button>
                                
                                <button className="text-white hover:text-brand-500 transition-colors">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </div>
                            <button className="text-slate-400 hover:text-white">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            </button>
                        </div>

                        {!post.textOnly && editingPostId !== post.id && (
                            <div className="mb-2">
                                <p className="text-sm text-slate-200 leading-relaxed">
                                    <span className="font-bold text-white mr-2">{post.user.split(' ')[0].toLowerCase()}.fit</span>
                                    {post.caption.replace(/#\w+/g, '')}
                                    {post.tags.map(tag => (
                                        <span key={tag} className="text-brand-500 font-medium ml-1 text-xs">{tag}</span>
                                    ))}
                                </p>
                            </div>
                        )}
                        
                        <button onClick={() => handleToggleComments(post.id)} className="text-xs text-slate-500 font-medium hover:text-slate-300 transition-colors">
                            {expandedComments === post.id ? 'Hide comments' : `View all ${post.commentsCount} comments`}
                        </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments === post.id && (
                        <div className="bg-black/20 p-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                                {post.comments.length > 0 ? (
                                    post.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3 text-sm group">
                                            <div className="w-6 h-6 rounded-full bg-dark-700 flex-shrink-0 text-[10px] flex items-center justify-center font-bold text-slate-400 border border-white/5">
                                                {comment.user.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-white text-xs">{comment.user}</span>
                                                    <span className="text-slate-500 text-[10px]">{comment.time}</span>
                                                </div>
                                                <p className="text-slate-300 text-xs mt-0.5">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-slate-500 italic">No comments yet.</p>
                                        <p className="text-[10px] text-slate-600">Be the first to share some love!</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-brand-500 border border-brand-500/20">
                                    You
                                </div>
                                <input 
                                    type="text" 
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-dark-800 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                />
                                <button 
                                    onClick={() => handleAddComment(post.id)}
                                    disabled={!commentInput.trim()}
                                    className="text-brand-500 font-bold text-xs disabled:opacity-50 hover:text-brand-400 px-2"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
        
        {/* Create Post FAB */}
        <div className="fixed bottom-24 md:bottom-12 right-6 md:right-12 z-40">
            <button 
                onClick={() => setShowPostModal(true)}
                className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-brand-500/40 hover:scale-110 hover:shadow-brand-500/60 transition-all duration-300 group"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
        </div>

        {/* Community Guidelines Modal */}
        {showRules && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-dark-900 border border-white/10 rounded-3xl w-full max-w-md p-8 relative">
                    <button 
                        onClick={() => setShowRules(false)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500 border border-brand-500/20">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-black text-white">House Rules</h2>
                        <p className="text-slate-400 text-sm mt-1">Keep the community safe and supportive.</p>
                    </div>
                    <ul className="space-y-4 text-sm text-slate-300">
                        <li className="flex gap-3">
                            <span className="text-green-500 font-bold">1.</span>
                            <span><strong>Be Respectful.</strong> Zero tolerance for hate speech, bullying, or harassment.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-green-500 font-bold">2.</span>
                            <span><strong>Privacy First.</strong> Do not share personal contact info or sensitive data (doxxing).</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-green-500 font-bold">3.</span>
                            <span><strong>No Spam.</strong> Keep posts relevant to fitness, nutrition, and personal growth.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-green-500 font-bold">4.</span>
                            <span><strong>Safe Content.</strong> NSFW or violent content will result in an immediate ban.</span>
                        </li>
                    </ul>
                    <button 
                        onClick={() => setShowRules(false)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl mt-8 transition-colors"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        )}

        {/* Create Post Modal */}
        {showPostModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-dark-800 rounded-3xl w-full max-w-md border border-white/10 overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dark-900/50">
                        <h2 className="text-lg font-bold text-white">New Post</h2>
                        <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-white transition-colors">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden border border-white/10 flex-shrink-0">
                                <img src={`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100`} className="w-full h-full object-cover" />
                            </div>
                            <textarea 
                                value={newCaption}
                                onChange={(e) => setNewCaption(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full bg-transparent text-white resize-none focus:outline-none min-h-[100px] text-lg placeholder-slate-500 leading-relaxed"
                            />
                        </div>
                        
                        {newImage && (
                            <div className="relative rounded-xl overflow-hidden h-64 border border-white/10 group">
                                <img src={newImage} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setNewImage(null)}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        )}

                        <div className="border-t border-white/5 pt-4">
                            <p className="text-[10px] text-slate-500 text-center mb-4">
                                By posting, you agree to our <button onClick={() => setShowRules(true)} className="text-brand-500 hover:underline">Community Rules</button>.
                            </p>
                            <div className="flex justify-between items-center">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 text-brand-500 font-bold text-sm hover:text-brand-400 hover:bg-brand-500/10 px-4 py-2 rounded-xl transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                    Photo/Video
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                
                                <button 
                                    onClick={handleSubmitPost}
                                    disabled={!newCaption && !newImage}
                                    className="bg-brand-500 text-black font-bold py-2 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
