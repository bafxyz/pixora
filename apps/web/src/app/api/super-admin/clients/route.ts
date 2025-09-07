import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET() {
  try {
    // Получаем всех клиентов со статистикой
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: {
            guests: true,
            photos: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const clientsWithStats = clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      createdAt: client.createdAt,
      guestsCount: client._count.guests,
      photosCount: client._count.photos,
      ordersCount: client._count.orders,
    }))

    return NextResponse.json({
      clients: clientsWithStats,
      total: clientsWithStats.length,
    })
  } catch (error) {
    console.error('Super admin clients API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!name || !name.trim() || !email || !email.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли клиент с таким email
    const existingClient = await prisma.client.findUnique({
      where: { email: email.trim() },
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // Создаем нового клиента
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        guestsCount: 0,
        photosCount: 0,
        ordersCount: 0,
      },
    })
  } catch (error) {
    console.error('Create client API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
