'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false
    })

    setIsLoading(false)

    if (result?.error) {
      setError('Invalid username or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fantasy-card torch-glow p-8 w-full max-w-md">
        {/* D20 Icon */}
        <div className="flex justify-center mb-6">
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20 text-[var(--gold)]"
            fill="currentColor"
          >
            <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="none" stroke="currentColor" strokeWidth="3"/>
            <polygon points="50,5 95,30 50,50 5,30" fill="currentColor" opacity="0.3"/>
            <polygon points="95,30 95,70 50,50" fill="currentColor" opacity="0.2"/>
            <polygon points="50,95 95,70 50,50 5,70" fill="currentColor" opacity="0.4"/>
            <polygon points="5,30 5,70 50,50" fill="currentColor" opacity="0.1"/>
            <text x="50" y="58" textAnchor="middle" fontSize="24" fontFamily="Cinzel" fill="var(--forest-green)">20</text>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2 text-[var(--forest-green)]">
          Lost Mine of Phandelver
        </h1>
        <p className="text-center text-[var(--stone-gray-light)] mb-8">
          Campaign Management Portal
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[var(--stone-gray)] mb-2"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="fantasy-input w-full"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--stone-gray)] mb-2"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fantasy-input w-full"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="danger-indicator p-3 rounded text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entering the Realm...' : 'Enter the Realm'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[var(--stone-gray)]">
          <p className="text-center text-sm text-[var(--stone-gray-light)]">
            Sword Coast • Neverwinter Region
          </p>
        </div>
      </div>
    </div>
  )
}
