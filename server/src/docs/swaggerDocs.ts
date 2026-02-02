import swaggerJsdoc from 'swagger-jsdoc';
import env from '../config/env';
import { paths } from './SwaggerDocs/paths';
import { schemas } from './SwaggerDocs/components/schemas';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CoopNest API Documentation',
            version: '1.0.0',
            description: 'Comprehensive API documentation for the Cooperative Savings and Loans Management System',
            contact: {
                name: 'API Support',
                email: 'support@coopnest.com'
            },
            license: {
                name: 'Proprietary',
                url: 'https://coopnest.com/terms'
            }
        },
        servers: [
            {
                url: `${env.APPLICATION_URL}:${env.PORT}/api`,
                description: `${env.NODE_ENV} Server`
            }
        ],        components: {
            schemas,
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
        paths,
        tags: [            
            { name: 'Authentication', description: 'Authentication endpoints' },
            { name: 'User', description: 'User management endpoints' },
            { name: 'Admin', description: 'Admin user and profile management endpoints' },
            { name: 'Biodata', description: 'Member biodata management' },
            { 
                name: 'Biodata Backup', 
                description: 'Biodata backup and restore operations',
                'x-group': 'Biodata'
            },
            { name: 'Account', description: 'Bank account management' },
            { name: 'Loan', description: 'Loan management' },
            { name: 'Loan Repayment', description: 'Operations for managing loan repayments, tracking schedules, and reporting' },
            { name: 'Savings', description: 'Savings account management' },
            { name: 'Savings Withdrawal', description: 'Savings withdrawal request and approval workflow', 'x-group': 'Savings' },
            { name: 'Transaction', description: 'Transaction management' },
            { name: 'Request', description: 'Request and approval workflow' }
        ],
        'x-tagGroups': [
            {
                name: 'Biodata',
                tags: [
                    'Biodata',
                    'Biodata Management',
                    'Biodata Verification',
                    'Biodata Approval',
                    'Biodata Backup'
                ]
            },
            {
                name: 'Savings',
                tags: [
                    'Savings',
                    'Savings Withdrawal'
                ]
            },
        ]
    },
    apis: ['./src/modules/**/*.ts']
};

const swaggerDocs = swaggerJsdoc(options);

export default swaggerDocs;