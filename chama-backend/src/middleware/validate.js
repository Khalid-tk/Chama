import { ZodError } from 'zod'

export function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(error)
    }
  }
}
