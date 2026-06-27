// ============================================================
// Feed Service - Realtime backend for social feed
// Handles: posts, likes, comments, notifications
// ============================================================

import { createServer } from 'http'
import { Server } from 'socket.io'

// ---------- In-memory store ----------
const posts = new Map()
const users = new Map() // online users: socketId -> user
const notifications = []

// ---------- Seed data ----------
const seedUsers = [
  { id: 'u1', username: 'alex', displayName: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 'u2', username: 'maya', displayName: 'Maya Chen', avatar: 'https://i.pravatar.cc/150?img=47' },
  { id: 'u3', username: 'jordan', displayName: 'Jordan Kim', avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 'u4', username: 'sam', displayName: 'Sam Patel', avatar: 'https://i.pravatar.cc/150?img=68' },
  { id: 'u5', username: 'taylor', displayName: 'Taylor Brooks', avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: 'u6', username: 'nora', displayName: 'Nora Vance', avatar: 'https://i.pravatar.cc/150?img=23' },
]

const seedPosts = [
  { author: seedUsers[1], content: 'Golden hour over the bay. No filter, just nature showing off. 🌅', image: 'https://picsum.photos/seed/sunset/800/600' },
  { author: seedUsers[0], content: 'Just shipped a new feature after three weeks of work. Sometimes the smallest details take the longest. 🚀' },
  { author: seedUsers[2], content: 'Trying out a new espresso blend this morning. Notes of dark chocolate and cherry. Highly recommend. ☕', image: 'https://picsum.photos/seed/coffee/800/600' },
  { author: seedUsers[3], content: 'Hiked 12 miles today. Legs are jelly but the views were 100% worth it. 🥾🏔️', image: 'https://picsum.photos/seed/mountain/800/600' },
  { author: seedUsers[4], content: 'Reading "Project Hail Mary" by Andy Weir and I cannot put it down. Anyone else read it?' },
  { author: seedUsers[5], content: 'Homemade ramen on a rainy Sunday. The broth simmered for 8 hours. Patience pays off. 🍜', image: 'https://picsum.photos/seed/ramen/800/600' },
  { author: seedUsers[0], content: 'Tiny win today: refactored a 400-line function into 6 small ones. Code reviews will be so much easier.' },
  { author: seedUsers[2], content: 'Skateboard session at the park. Finally landed a kickflip after weeks of practice. 🛹', image: 'https://picsum.photos/seed/skate/800/600' },
]

const now = Date.now()
seedPosts.forEach((p, i) => {
  const id = `p${i + 1}`
  const likedBy = seedUsers.filter(() => Math.random() < 0.4).map(u => u.id)
  const comments = []
  if (Math.random() < 0.6) {
    const c = seedUsers[Math.floor(Math.random() * seedUsers.length)]
    comments.push({
      id: `c${id}-1`,
      postId: id,
      author: c,
      content: ['Looks amazing!', 'Congrats 🎉', 'Where is this?', 'Love this', 'So jealous'][Math.floor(Math.random() * 5)],
      createdAt: now - Math.floor(Math.random() * 3600000),
    })
  }
  posts.set(id, {
    id,
    author: p.author,
    content: p.content,
    image: p.image,
    createdAt: now - i * 1800000,
    likeCount: likedBy.length,
    commentCount: comments.length,
    likedBy,
    comments,
  })
})

// ---------- Helpers ----------
const genId = () => Math.random().toString(36).slice(2, 11)

// ---------- Socket.io server ----------
const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket) => {
  console.log(`[feed-service] connected: ${socket.id}`)

  // Client identifies themselves with a user profile
  socket.on('client:identify', (user) => {
    users.set(socket.id, user)
    socket.data.userId = user.id
    console.log(`[feed-service] identified ${socket.id} as ${user.username}`)
    socket.emit('server:initial-state', {
      posts: Array.from(posts.values()).sort((a, b) => b.createdAt - a.createdAt),
      notifications: notifications.filter(n => n.toUserId === user.id),
    })
  })

  // Like / unlike a post
  socket.on('client:toggle-like', ({ postId, user }) => {
    const post = posts.get(postId)
    if (!post) return
    const idx = post.likedBy.indexOf(user.id)
    const isLiking = idx === -1
    if (isLiking) {
      post.likedBy.push(user.id)
      post.likeCount = post.likedBy.length

      // Notify the post author (don't notify self-like)
      if (post.author.id !== user.id) {
        const notif = {
          id: genId(),
          type: 'like',
          toUserId: post.author.id,
          fromUser: user,
          postId: post.id,
          text: `${user.displayName} liked your post`,
          createdAt: Date.now(),
          read: false,
        }
        notifications.unshift(notif)
        // Push to author if online
        for (const [sid, u] of users.entries()) {
          if (u.id === post.author.id) {
            io.to(sid).emit('server:notification', notif)
          }
        }
      }
    } else {
      post.likedBy.splice(idx, 1)
      post.likeCount = post.likedBy.length
    }
    io.emit('server:post-updated', {
      id: post.id,
      likeCount: post.likeCount,
      likedBy: post.likedBy,
    })
  })

  // Add a comment
  socket.on('client:add-comment', ({ postId, user, content }) => {
    const post = posts.get(postId)
    if (!post || !content.trim()) return
    const comment = {
      id: genId(),
      postId,
      author: user,
      content: content.trim(),
      createdAt: Date.now(),
    }
    post.comments.push(comment)
    post.commentCount = post.comments.length

    // Notify the post author
    if (post.author.id !== user.id) {
      const notif = {
        id: genId(),
        type: 'comment',
        toUserId: post.author.id,
        fromUser: user,
        postId: post.id,
        text: `${user.displayName} commented: "${content.trim().slice(0, 60)}"`,
        createdAt: Date.now(),
        read: false,
      }
      notifications.unshift(notif)
      for (const [sid, u] of users.entries()) {
        if (u.id === post.author.id) {
          io.to(sid).emit('server:notification', notif)
        }
      }
    }

    io.emit('server:comment-added', comment)
    io.emit('server:post-updated', {
      id: post.id,
      commentCount: post.commentCount,
    })
  })

  // Create a new post
  socket.on('client:create-post', ({ user, content, image }) => {
    if (!content.trim()) return
    const post = {
      id: genId(),
      author: user,
      content: content.trim(),
      image,
      createdAt: Date.now(),
      likeCount: 0,
      commentCount: 0,
      likedBy: [],
      comments: [],
    }
    posts.set(post.id, post)
    io.emit('server:post-created', post)
  })

  // Mark notifications as read
  socket.on('client:mark-notifications-read', ({ userId }) => {
    notifications.forEach(n => {
      if (n.toUserId === userId) n.read = true
    })
  })

  socket.on('disconnect', () => {
    users.delete(socket.id)
    console.log(`[feed-service] disconnected: ${socket.id}`)
  })

  socket.on('error', (err) => {
    console.error(`[feed-service] socket error ${socket.id}:`, err)
  })
})

// ============================================================
// Simulated "other-user" activity bot
// This keeps the feed feeling alive even with one real user:
// random likes / comments arrive periodically so the realtime
// notifications system has something to demonstrate.
// ============================================================
const botComments = [
  '🔥🔥🔥',
  'This is amazing!',
  'Wow, congratulations!',
  'I needed to see this today 🙏',
  'Where was this taken?',
  'Adding to my bucket list',
  'You always post the best stuff',
  'Haha love it',
  'Teach me your ways 😅',
  'So good!',
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

setInterval(() => {
  if (posts.size === 0 || users.size === 0) return
  const realUserIds = Array.from(users.values()).map(u => u.id)
  if (realUserIds.length === 0) return

  const allPosts = Array.from(posts.values())
  const post = pick(allPosts)
  const botUser = pick(seedUsers)
  // Make sure the bot is not the post author (so author gets a real notification)
  if (botUser.id === post.author.id) return

  // 50% like, 50% comment
  if (Math.random() < 0.5) {
    // like — but only if not already liked
    if (post.likedBy.includes(botUser.id)) return
    post.likedBy.push(botUser.id)
    post.likeCount = post.likedBy.length
    io.emit('server:post-updated', { id: post.id, likeCount: post.likeCount, likedBy: post.likedBy })
    // Notify post author
    const notif = {
      id: genId(),
      type: 'like',
      toUserId: post.author.id,
      fromUser: botUser,
      postId: post.id,
      text: `${botUser.displayName} liked your post`,
      createdAt: Date.now(),
      read: false,
    }
    notifications.unshift(notif)
    for (const [sid, u] of users.entries()) {
      if (u.id === post.author.id) {
        io.to(sid).emit('server:notification', notif)
      }
    }
  } else {
    const content = pick(botComments)
    const comment = {
      id: genId(),
      postId: post.id,
      author: botUser,
      content,
      createdAt: Date.now(),
    }
    post.comments.push(comment)
    post.commentCount = post.comments.length
    io.emit('server:comment-added', comment)
    io.emit('server:post-updated', { id: post.id, commentCount: post.commentCount })
    const notif = {
      id: genId(),
      type: 'comment',
      toUserId: post.author.id,
      fromUser: botUser,
      postId: post.id,
      text: `${botUser.displayName} commented: "${content}"`,
      createdAt: Date.now(),
      read: false,
    }
    notifications.unshift(notif)
    for (const [sid, u] of users.entries()) {
      if (u.id === post.author.id) {
        io.to(sid).emit('server:notification', notif)
      }
    }
  }
}, 7000)

const PORT = process.env.PORT || 3003
httpServer.listen(PORT, () => {
  console.log(`[feed-service] realtime server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0))
})
