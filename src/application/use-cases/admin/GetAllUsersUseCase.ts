export class GetAllUsersUseCase {
    constructor(private userRespo: any) { }
    
    async execute() {
        return await this.userRespo.findAll();
    }
}