import { userSchemas } from './user.schema';
import { biodataSchemas } from './biodata.schema';
import { accountSchemas } from './account.schema';
import { loanSchemas } from './loan.schema';
import { requestSchemas } from './request.schema';
import { transactionSchemas } from './transaction.schema';
import { savingsSchemas } from './savings.schema';
import { adminSchemas } from './admin.schema';

export const schemas = {
    ...userSchemas,
    ...adminSchemas,
    ...biodataSchemas,
    ...accountSchemas,
    ...loanSchemas,
    ...requestSchemas,
    ...transactionSchemas,
    ...savingsSchemas,
};
