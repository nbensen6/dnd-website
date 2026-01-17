'use client'

import { Stage, Layer, Rect, Circle, Image as KonvaImage, Text } from 'react-konva'
import { useEffect, useState } from 'react'

interface Token {
  id: string
  characterId?: string
  name: string
  x: number
  y: number
  size: number
  color: string
  isNPC: boolean
}

interface BattlefieldState {
  id: string
  name: string
  mapImageUrl?: string | null
  gridSize: number
  gridWidth: number
  gridHeight: number
  tokens: Token[]
}

interface BattlefieldCanvasProps {
  battlefield: BattlefieldState
  scale: number
  stagePos: { x: number; y: number }
  setStagePos: (pos: { x: number; y: number }) => void
  canMoveToken: (token: Token) => boolean
  handleTokenDragEnd: (token: Token, newX: number, newY: number) => void
  isDM: boolean
  removeToken: (tokenId: string) => void
}

export default function BattlefieldCanvas({
  battlefield,
  scale,
  stagePos,
  setStagePos,
  canMoveToken,
  handleTokenDragEnd,
  isDM,
  removeToken
}: BattlefieldCanvasProps) {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 })
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 100
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (battlefield?.mapImageUrl) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = battlefield.mapImageUrl
      img.onload = () => setMapImage(img)
    } else {
      setMapImage(null)
    }
  }, [battlefield?.mapImageUrl])

  const stageWidth = battlefield.gridWidth * battlefield.gridSize
  const stageHeight = battlefield.gridHeight * battlefield.gridSize

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
      draggable
      onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
    >
      <Layer>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={stageWidth}
          height={stageHeight}
          fill="#2a2a2a"
        />

        {/* Map Image */}
        {mapImage && (
          <KonvaImage
            image={mapImage}
            x={0}
            y={0}
            width={stageWidth}
            height={stageHeight}
          />
        )}

        {/* Grid - Vertical Lines */}
        {Array.from({ length: battlefield.gridWidth + 1 }).map((_, i) => (
          <Rect
            key={`v-${i}`}
            x={i * battlefield.gridSize}
            y={0}
            width={1}
            height={stageHeight}
            fill="rgba(255,255,255,0.2)"
          />
        ))}

        {/* Grid - Horizontal Lines */}
        {Array.from({ length: battlefield.gridHeight + 1 }).map((_, i) => (
          <Rect
            key={`h-${i}`}
            x={0}
            y={i * battlefield.gridSize}
            width={stageWidth}
            height={1}
            fill="rgba(255,255,255,0.2)"
          />
        ))}

        {/* Tokens */}
        {battlefield.tokens.map(token => (
          <Circle
            key={token.id}
            x={token.x + battlefield.gridSize / 2}
            y={token.y + battlefield.gridSize / 2}
            radius={token.size / 2}
            fill={token.color}
            stroke={canMoveToken(token) ? '#c9a227' : '#666'}
            strokeWidth={canMoveToken(token) ? 3 : 1}
            draggable={canMoveToken(token)}
            onDragEnd={(e) => {
              const newX = e.target.x() - battlefield.gridSize / 2
              const newY = e.target.y() - battlefield.gridSize / 2
              handleTokenDragEnd(token, newX, newY)
            }}
            onContextMenu={(e) => {
              e.evt.preventDefault()
              if (isDM) removeToken(token.id)
            }}
          />
        ))}

        {/* Token Labels */}
        {battlefield.tokens.map(token => (
          <Text
            key={`label-${token.id}`}
            x={token.x}
            y={token.y + battlefield.gridSize + 2}
            width={battlefield.gridSize}
            text={token.name}
            fontSize={10}
            fill="#fff"
            align="center"
          />
        ))}
      </Layer>
    </Stage>
  )
}
