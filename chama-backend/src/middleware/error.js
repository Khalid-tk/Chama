export function errorHandler(err, req, res, next) {
  console.error('Error:', err)

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    })
  }

  if (err.message === 'Not allowed by CORS') {
    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }
    return res.status(403).json({
      success: false,
      message: 'Not allowed by CORS',
    })
  }

  // Default error
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  })
}
