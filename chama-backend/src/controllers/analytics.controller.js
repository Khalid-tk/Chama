import { getAdminAnalytics, getMemberAnalytics } from '../services/analytics.service.js'

export async function getAdminAnalyticsData(req, res, next) {
  try {
    const { chamaId } = req.params
    const range = req.query.range || '6m'

    const analytics = await getAdminAnalytics(chamaId, range)

    res.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMemberAnalyticsData(req, res, next) {
  try {
    const { chamaId } = req.params
    const range = req.query.range || '6m'

    const analytics = await getMemberAnalytics(chamaId, req.user.id, range)

    res.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    next(error)
  }
}
