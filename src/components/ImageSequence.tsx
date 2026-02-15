'use client'

import React, { useState, useEffect, useRef } from 'react'

interface ImageSequenceProps {
    folder: string;
    prefix: string;
    totalFrames: number;
    extension: string;
    fps?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const ImageSequence: React.FC<ImageSequenceProps> = ({
    folder,
    prefix,
    totalFrames,
    extension,
    fps = 24,
    className,
    style
}) => {
    const [progress, setProgress] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imagesRef = useRef<HTMLImageElement[]>([])
    const frameRef = useRef(0)

    useEffect(() => {
        let loadedCount = 0
        const images: HTMLImageElement[] = []

        for (let i = 0; i < totalFrames; i++) {
            const img = new Image()
            const frameIndex = i.toString().padStart(3, '0')
            img.src = `/${folder}/${prefix}${frameIndex}.${extension}`
            img.onload = () => {
                loadedCount++
                setProgress(Math.floor((loadedCount / totalFrames) * 100))
                if (loadedCount === totalFrames) {
                    setIsLoaded(true)
                }
            }
            images.push(img)
        }
        imagesRef.current = images
    }, [folder, prefix, totalFrames, extension])

    useEffect(() => {
        if (!isLoaded || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        let lastTime = 0
        const frameDuration = 1000 / fps

        const animate = (time: number) => {
            if (!lastTime) lastTime = time
            const deltaTime = time - lastTime

            if (deltaTime >= frameDuration) {
                const img = imagesRef.current[frameRef.current]
                if (img) {
                    const canvasAspect = canvas.width / canvas.height
                    const imgAspect = img.width / img.height
                    let drawWidth, drawHeight, offsetX, offsetY

                    if (imgAspect > canvasAspect) {
                        drawHeight = canvas.height
                        drawWidth = canvas.height * imgAspect
                        offsetX = -(drawWidth - canvas.width) / 2
                        offsetY = 0
                    } else {
                        drawWidth = canvas.width
                        drawHeight = canvas.width / imgAspect
                        offsetX = 0
                        offsetY = -(drawHeight - canvas.height) / 2
                    }

                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
                }
                frameRef.current = (frameRef.current + 1) % totalFrames
                lastTime = time
            }
            requestAnimationFrame(animate)
        }

        const animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [isLoaded, totalFrames, fps])

    if (!isLoaded) {
        return (
            <div style={{
                ...style,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#131f1c',
                flexDirection: 'column',
                gap: '12px'
            }} className={className}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(42,157,124,0.1)',
                    borderTopColor: 'var(--color-brand-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <span className="text-[10px] font-black tracking-[0.3em] text-brand-primary uppercase">Cargando {progress}%</span>
                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            style={{ ...style, display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            className={className}
        />
    )
}
