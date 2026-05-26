'use client'

import React from 'react'
import { AlertCircle, Clock, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface ErrorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  error: {
    type: 'rate-limit' | 'auth' | 'forbidden' | 'general'
    message: string
    details?: string
  }
  onRetry?: () => void
  onAuthClose?: () => void
}

export function ErrorModal({
  open,
  onOpenChange,
  error,
  onRetry,
  onAuthClose
}: ErrorModalProps) {
  const handleAuthClose = () => {
    onOpenChange(false)
    onAuthClose?.()
  }

  const handleStripeCheckout = async (
    plan: 'pro' | 'ultra'
  ) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create-checkout',
          plan
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
        return
      }

      console.error('Stripe URL missing:', data)
      alert('Stripe checkout failed')
    } catch (error) {
      console.error('Stripe checkout failed:', error)
      alert('Stripe checkout failed')
    }
  }

  const getErrorIcon = () => {
    switch (error.type) {
      case 'rate-limit':
        return <Clock className="size-6 text-yellow-500" />

      case 'auth':
      case 'forbidden':
        return (
          <AlertCircle className="size-6 text-red-500" />
        )

      default:
        return (
          <AlertCircle className="size-6 text-orange-500" />
        )
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'rate-limit':
        return 'Rate Limit Exceeded'

      case 'auth':
        return 'Continue with Morphic'

      case 'forbidden':
        return 'Access Denied'

      default:
        return 'Error Occurred'
    }
  }

  const getErrorDescription = () => {
    switch (error.type) {
      case 'rate-limit':
        return (
          error.message ||
          'You have made too many requests. Please wait a moment before trying again.'
        )

      case 'auth':
        return 'To use Morphic, sign in to your account or create a new one.'

      case 'forbidden':
        return 'You do not have permission to access this resource.'

      default:
        return (
          error.message ||
          'An unexpected error occurred. Please try again.'
        )
    }
  }

  const getErrorDetails = () => {
    if (error.type === 'rate-limit') {
      return 'The limit will reset at midnight UTC. You can continue using speed mode without restrictions.'
    }

    return error.details
  }

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open && error.type === 'auth') {
          handleAuthClose()
        } else {
          onOpenChange(open)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            {getErrorIcon()}
          </div>

          <DialogTitle className="text-center text-xl font-semibold">
            {getErrorTitle()}
          </DialogTitle>

          <DialogDescription className="text-center text-muted-foreground">
            {getErrorDescription()}
          </DialogDescription>

          {getErrorDetails() &&
            error.type !== 'rate-limit' && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                {getErrorDetails()}
              </div>
            )}
        </DialogHeader>

        <DialogFooter className="flex-col gap-2">
          {error.type === 'auth' ? (
            <>
              <Button asChild className="w-full">
                <a href="/auth/sign-up">Sign Up</a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <a href="/auth/login">Sign In</a>
              </Button>
            </>
          ) : (
            <>
              {error.type === 'rate-limit' ? (
                <div className="w-full space-y-3">
                  <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-4">
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      Upgrade Your Plan
                    </h3>

                    <p className="mb-4 text-sm text-zinc-400">
                      You reached the free usage limit.
                      Upgrade for unlimited AI chats,
                      image generation, and premium
                      models.
                    </p>

                    <div className="grid gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">
                              Pro
                            </div>

                            <div className="text-xs text-zinc-400">
                              Unlimited chats + images
                            </div>
                          </div>

                          <div className="text-lg font-bold text-white">
                            ₹499
                          </div>
                        </div>

                        <Button
                          onClick={() =>
                            handleStripeCheckout('pro')
                          }
                          className="mt-3 w-full rounded-xl bg-violet-600 hover:bg-violet-700"
                        >
                          Upgrade to Pro
                        </Button>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">
                              Ultra
                            </div>

                            <div className="text-xs text-zinc-400">
                              Everything unlocked
                            </div>
                          </div>

                          <div className="text-lg font-bold text-white">
                            ₹999
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          onClick={() =>
                            handleStripeCheckout('ultra')
                          }
                          className="mt-3 w-full rounded-xl"
                        >
                          Get Ultra
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-full"
                  >
                    Maybe Later
                  </Button>
                </div>
              ) : (
                <>
                  {onRetry && (
                    <Button
                      onClick={() => {
                        onRetry()
                        onOpenChange(false)
                      }}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 size-4" />
                      Try Again
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
