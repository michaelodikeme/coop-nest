import { authPaths } from './auth.paths';
import { userPaths } from './user.paths';
import { biodataPaths } from './biodata.paths';
import { accountPaths } from './account.paths';
import { loanPaths } from './loan.paths';
import { requestPaths } from './request.paths';
import { transactionPaths } from './transaction.paths';
import { savingsPaths } from './savings.paths';
import { adminPaths } from './admin.paths';

export const paths = {
    ...authPaths,
    ...userPaths,
    ...adminPaths,
    ...biodataPaths,
    ...accountPaths,
    ...loanPaths,
    ...requestPaths,
    ...transactionPaths,
    ...savingsPaths,
};
