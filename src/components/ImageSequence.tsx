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
    const [currentFrame, setCurrentFrame] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)
    const imagesRef = useRef<HTMLImageElement[]>([])

    useEffect(() => {
        let loadedCount = 0
        const images: HTMLImageElement[] = []

        for (let i = 0; i < totalFrames; i++) {
            const img = new Image()
            const frameIndex = i.toString().padStart(3, '0')
            img.src = `/${folder}/${prefix}${frameIndex}.${extension}`
            img.onload = () => {
                loadedCount++
                if (loadedCount === totalFrames) {
                    setIsLoaded(true)
                }
            }
            images.push(img)
        }
        imagesRef.current = images
    }, [folder, prefix, totalFrames, extension])

    useEffect(() => {
        if (!isLoaded) return

        const interval = setInterval(() => {
            setCurrentFrame(prev => (prev + 1) % totalFrames)
        }, 1000 / fps)

        return () => clearInterval(interval)
    }, [isLoaded, totalFrames, fps])

    if (!isLoaded) {
        return (
            <div style={{
                ...style,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#131f1c'
            }} className={className}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(42,157,124,0.1)',
                    borderTopColor: 'var(--color-brand-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div style={{ ...style, position: 'relative', overflow: 'hidden' }} className={className}>
            {imagesRef.current.map((img, idx) => (
                <img
                    key={idx}
                    src={img.src}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: idx === currentFrame ? 1 : 0,
                        transition: 'none',
                        zIndex: idx === currentFrame ? 1 : 0
                    }}
                    alt={`Frame ${idx}`}
                />
            ))}
        </div>
    )
}
