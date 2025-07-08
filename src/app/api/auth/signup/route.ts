import { NextRequest, NextResponse } from 'next/server'
import { serverAuthService } from '@/services/auth/authService.server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, fullName } = await request.json()

    if (!email || !password || !username || !fullName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const { user, error, token } = await serverAuthService.signUpServer(email, password, {
      username,
      fullName,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      )
    }

    // Set the JWT token as an HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}