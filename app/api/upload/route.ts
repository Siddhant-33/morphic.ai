import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'File upload is disabled'
    },
    {
      status: 200
    }
  )
}
