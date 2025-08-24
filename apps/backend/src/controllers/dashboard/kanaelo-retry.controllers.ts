import { type Request, type Response, type NextFunction } from "express";
import { retryFailedKanaeloCalculations } from "../../services/rabbitmq-retry.services";

/**
 * Controller to retry failed kanaelo calculations
 * This moves messages from the error queue back to the calculation queue
 */
export const retryFailedKanaeloCalculationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await retryFailedKanaeloCalculations();

    res.json({
      message: `Successfully moved ${result.moved} messages from error queue to calculation queue`,
      moved: result.moved,
      errors: result.errors,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
};
