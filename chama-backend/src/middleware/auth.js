import { verifyToken } from '../utils/jwt.js'

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}
