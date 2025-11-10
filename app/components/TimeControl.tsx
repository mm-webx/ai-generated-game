'use client'

import { useTimeControl } from '@/components/game-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Speed } from '@/components/game/types'

export default function TimeControl() {
  const { isPaused, speed, gameTime, togglePause, handleSpeedChange, formatTime } = useTimeControl()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Time Control</CardTitle>
        <CardDescription>Control simulation speed and pause state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Game Time Display */}
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Game Time</div>
          <div className="text-6xl font-mono font-bold tracking-tight">
            {formatTime(gameTime)}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isPaused ? 'secondary' : 'default'}>
              {speed}x Speed
            </Badge>
            {isPaused && (
              <Badge variant="outline">Paused</Badge>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-4">
          {/* Pause/Play Button */}
          <Button
            onClick={togglePause}
            variant={isPaused ? 'default' : 'destructive'}
            size="lg"
            className="w-full"
          >
            {isPaused ? (
              <>
                <span>▶</span>
                Resume
              </>
            ) : (
              <>
                <span>⏸</span>
                Pause
              </>
            )}
            <span className="ml-auto text-xs opacity-75">(`)</span>
          </Button>

          {/* Speed Control Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {([1, 5, 20] as Speed[]).map((speedOption) => (
              <Button
                key={speedOption}
                onClick={() => handleSpeedChange(speedOption)}
                variant={speed === speedOption && !isPaused ? 'default' : 'outline'}
                size="lg"
                className="flex flex-col h-auto py-4"
              >
                <span className="text-lg font-semibold">{speedOption}x</span>
                <span className="text-xs text-muted-foreground mt-1">
                  ({speedOption})
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm font-semibold mb-3">Keyboard Shortcuts</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded-md text-xs font-mono">
                  `
                </kbd>
                <span className="text-muted-foreground">Toggle Pause</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded-md text-xs font-mono">
                  1
                </kbd>
                <span className="text-muted-foreground">Speed x1</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded-md text-xs font-mono">
                  2
                </kbd>
                <span className="text-muted-foreground">Speed x5</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded-md text-xs font-mono">
                  3
                </kbd>
                <span className="text-muted-foreground">Speed x20</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

